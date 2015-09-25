var alt = require("../alt");

class SiteActions {
  logInUser(user) {
    this.dispatch(user);
  }

  navigateToPage(routeInfo) {
    let pageInfo = {};
    pageInfo.page = routeInfo.routes[1].name;

    if (pageInfo.page === "part") {
      pageInfo.part = {"manufacturerID": routeInfo.params.manufacturer,
                       "partId": routeInfo.params.part,
                       "path": routeInfo.params.manufacturer + "/" + routeInfo.params.part};
    } else if (pageInfo.page === "unknownManufacturer") {
      pageInfo.page = "part";
      pageInfo.part = {"siteID": routeInfo.params.site,
                       "partId": routeInfo.params.part,
                       "path": "UnknownManufacturer/" + routeInfo.params.site + "/" + routeInfo.params.part};
    }
    this.dispatch(pageInfo);
  }
}

module.exports = alt.createActions(SiteActions);
