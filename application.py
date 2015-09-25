# -*- coding: utf-8 -*-

from cryptography.fernet import Fernet
from flask import Flask, render_template, Response, abort, session, request, url_for, flash, redirect
from flask.ext.github import GitHub, GitHubError
import elasticsearch
import os
import os.path

import pylru

import base64
import copy
import requests
import json
import hmac
import math
import urllib
import urlparse
from hashlib import sha1

import collections

rcpart = Flask(__name__)
rcpart.config['GITHUB_CLIENT_ID'] = os.environ['GITHUB_CLIENT_ID']
rcpart.config['GITHUB_CLIENT_SECRET'] = os.environ['GITHUB_CLIENT_SECRET']
rcpart.config['GITHUB_BASE_URL'] = os.environ['GITHUB_BASE_URL']
rcpart.config['PROPAGATE_EXCEPTIONS'] = True
application = rcpart

es = elasticsearch.Elasticsearch([os.environ['ES_HOST']])

partCategories_string = ""
partCategories = {}

github_cache = pylru.lrucache(64)

from git import Repo

github = GitHub(rcpart)

SOCIAL_BOTS = ["facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
               "facebookexternalhit/1.1",
               "Mozilla/5.0 (compatible; redditbot/1.0; +http://www.reddit.com/feedback)",
               "Twitterbot",
               "Pinterest",
               "Google (+https://developers.google.com/+/web/snippet/)",
               "Mozilla/5.0 (compatible; Google-Structured-Data-Testing-Tool +http://developers.google.com/structured-data/testing-tool/)"]

def is_social_bot():
  for bot in SOCIAL_BOTS:
    if bot in request.user_agent.string:
      return True
  return False

def CloneOrPull():
  r = None
  if not os.path.isdir("parts-repo"):
    r = Repo.clone_from("https://github.com/rcbuild-info/parts.git", "parts-repo")
    #r = Repo.clone_from("/Users/tannewt/local-github/repos/rcbuild-info/parts", "parts-repo")
  else:
    r = Repo("parts-repo")
  fetch_info = r.remote().pull()

PARTS_BY_ID = {}
SMALL_PARTS_BY_ID = {}
SMALL_PARTS_BY_CATEGORY = {}
LINKS = {}

def addPart(dest, manufacturerID, partID, part):
  if manufacturerID not in dest:
    dest[manufacturerID] = {}
  dest[manufacturerID][partID] = part

def updatePartIndexHelper():
  CloneOrPull()
  new_parts_by_id = {}
  new_small_parts_by_id = {}
  new_small_parts_by_category = {}
  new_links = {}
  for dirpath, dirnames, filenames in os.walk("parts-repo"):
    manufacturerID = dirpath[len("parts-repo/"):]
    for filename in filenames:
      if not filename.endswith("json"):
        continue
      partID = filename[:-len(".json")]
      full_path = os.path.join(dirpath, filename)
      if os.path.islink(full_path):
        target = os.readlink(full_path)
        split = target.split("/")
        m = manufacturerID
        p = target
        if len(split) == 2:
          m, p = split
        addPart(new_links, manufacturerID, partID, (m, p[:-len(".json")]))
        continue
      with open(full_path, "r") as f:
        part = json.load(f)
        part["id"] = manufacturerID + "/" + partID
        small_part = {"manufacturer": part["manufacturer"],
                      "name": part["name"],
                      "categories": []}
        categories = []
        if "version" not in part:
          categories = [part["category"]]
        else:
          categories = part["categories"]
        for category in categories:
          if category not in new_small_parts_by_category:
            new_small_parts_by_category[category] = {}
          addPart(new_small_parts_by_category[category], manufacturerID, partID, small_part)
        addPart(new_small_parts_by_id, manufacturerID, partID, small_part)
        addPart(new_parts_by_id, manufacturerID, partID, part)
  global SMALL_PARTS_BY_CATEGORY
  global SMALL_PARTS_BY_ID
  global PARTS_BY_ID
  global LINKS
  SMALL_PARTS_BY_CATEGORY = new_small_parts_by_category
  SMALL_PARTS_BY_ID = new_small_parts_by_id
  PARTS_BY_ID = new_parts_by_id
  LINKS = new_links

@rcpart.route('/update/partIndex', methods=["GET", "HEAD", "OPTIONS", "POST"])
def updatePartIndex():
  # Don't update if we can't validate the requester.
  if request.method == "GET":
    github_response = github.request("GET", "user")
    if github_response["id"] != 52649:
      abort(403)
  elif request.method == "POST":
    h = hmac.new(os.environ['GITHUB_PART_HOOK_HMAC'], request.data, sha1)
    if not hmac.compare_digest(request.headers["X-Hub-Signature"], u"sha1=" + h.hexdigest()):
      abort(403)
  updatePartIndexHelper()
  return 'ok'

@rcpart.route('/partIndex/by/<by>.json')
def partIndex(by):
  if by == "category":
    return Response(json.dumps(SMALL_PARTS_BY_CATEGORY),
                    content_type="application/json")
  elif by == "id":
    return Response(json.dumps(SMALL_PARTS_BY_ID),
                    content_type="application/json")
  abort(404)

@rcpart.route('/parts/<classification>')
def parts(classification):
    return render_template('main.html')

def get_github(url, headers={}, use_cache_even_when_logged_in=False, skip_cache=False):
  has_if = False
  if request and "If-Modified-Since" in request.headers:
    headers["If-Modified-Since"] = request.headers["If-Modified-Since"]
    has_if = True
  if request and "If-None-Match" in request.headers:
    headers["If-None-Match"] = request.headers["If-None-Match"]
    has_if = True
  if not skip_cache and (use_cache_even_when_logged_in or (not has_if and "o" not in session)) and url in github_cache:
    cached = github_cache[url]
    return Response(cached["text"],
                    status=cached["status_code"],
                    headers=cached["headers"])
  github_response = github.raw_request("GET", url, headers=headers)
  cache_response = url != "user" and not skip_cache
  if github_response.status_code == requests.codes.ok:
    resp = Response(github_response.text)
    resp.headers['etag'] = github_response.headers['etag']
    resp.headers['last-modified'] = github_response.headers['last-modified']
    resp.headers['cache-control'] = github_response.headers['cache-control']
    if cache_response:
      github_cache[url] = {"text": github_response.text,
                           "status_code": github_response.status_code,
                           "headers": resp.headers}
    return resp
  elif github_response.status_code == requests.codes.not_modified:
    resp = Response(status=requests.codes.not_modified)
    if 'etag' in github_response.headers:
      resp.headers['etag'] = github_response.headers['etag']
    if 'last-modified' in github_response.headers:
      resp.headers['last-modified'] = github_response.headers['last-modified']
    resp.headers['cache-control'] = github_response.headers['cache-control']
    return resp
  elif github_response.status_code == requests.codes.forbidden and github_response.headers["x-ratelimit-remaining"] == '0':
    print("ran out of freebie github quota!")
    return Response(status=429)

  if cache_response:
    github_cache[url] = {"text": "",
                         "status_code": github_response.status_code,
                         "headers": {}}
  return Response(status=github_response.status_code)

@github.access_token_getter
def token_getter():
  return os.environ["READONLY_GITHUB_TOKEN"]

def part_helper(manufacturerID, partID):
  if manufacturerID in LINKS and partID in LINKS[manufacturerID]:
    url = '/part/' + "/".join(LINKS[manufacturerID][partID]) + ".json"
    if not application.debug:
      url = urlparse.urljoin("https://rcpart.info", url)
    return redirect(url)
  if manufacturerID in PARTS_BY_ID and partID in PARTS_BY_ID[manufacturerID]:
    return json.dumps(PARTS_BY_ID[manufacturerID][partID])
  abort(404)

@rcpart.route('/part/<manufacturerID>/<partID>.json')
def part_json(manufacturerID, partID):
  return part_helper(manufacturerID, partID)

@rcpart.route('/part/UnknownManufacturer/<siteID>/<partID>.json')
def unknown_part_json(siteID, partID):
  return part_helper("UnknownManufacturer/" + siteID, partID)

def updatePartCategoriesHelper():
  global partCategories_string
  global partCategories

  resp = get_github("repos/rcbuild-info/part-skeleton/contents/partCategories.json", {"accept": "application/vnd.github.v3.raw"}, skip_cache=True)

  try:
    partCategories = json.loads(resp.get_data(True))
  except:
    print("Failed to parse partCategories.json")
    return
  partCategories_string = resp.get_data(True)

@rcpart.route('/update/partCategories', methods=["GET", "HEAD", "OPTIONS", "POST"])
def updatePartCategories():
  if request.method != "POST":
    abort(405)

  h = hmac.new(os.environ['GITHUB_PART_HOOK_HMAC'], request.data, sha1)
  if not rcpart.debug and not hmac.compare_digest(request.headers["X-Hub-Signature"], u"sha1=" + h.hexdigest()):
    abort(403)

  updatePartCategoriesHelper()
  return 'ok'

@rcpart.route('/partCategories.json')
def part_categories():
    return Response(partCategories_string)

@rcpart.route('/healthz')
def healthz():
  return Response(response="ok", content_type="Content-Type: text/plain; charset=utf-8", status=requests.codes.ok)

@rcpart.route('/')
def index():
  return render_template('main.html')

@rcpart.route('/part/<manufacturerID>/<partID>')
def part(manufacturerID, partID):
  return render_template('main.html')

@rcpart.route('/part/UnknownManufacturer/<siteID>/<partID>')
def unknown_part(siteID, partID):
  return render_template('main.html')

updatePartCategoriesHelper()
updatePartIndexHelper()
if __name__ == '__main__':
  application.debug = True
  application.run()
