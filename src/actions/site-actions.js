var alt = require("../alt");

class SiteActions {
  logInUser(user) {
    this.dispatch(user);
  }

  navigateToPage(routes, params) {
    let pageInfo = {};
    if (routes[1].path === undefined) {
      pageInfo.page = "/";
    } else if (routes[1].path.startsWith("part/UnknownManufacturer")) {
      pageInfo.page = "unknown";
    } else if (routes[1].path.startsWith("part")) {
      pageInfo.page = "part";
    }

    if (pageInfo.page === "part") {
      pageInfo.part = {"manufacturerID": params.manufacturer,
                       "partId": params.part,
                       "path": params.manufacturer + "/" + params.part};
    } else if (pageInfo.page == "unknown") {
      pageInfo.page = "part";
      pageInfo.part = {"siteID": params.site,
                       "partId": params.part,
                       "path": "UnknownManufacturer/" + params.site + "/" + params.part};
    }
    this.dispatch(pageInfo);
  }
}

module.exports = alt.createActions(SiteActions);
