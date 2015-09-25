import alt from "../alt";

import SiteActions from "../actions/site-actions";

class SiteStore {
  constructor() {
    this.on("error", (err) => {
      console.log(err);
    });

    this.page = null;
    this.activePart = null;

    this.bindListeners({
      navigateToPage: SiteActions.navigateToPage
    });
  }

  navigateToPage(pageInfo) {
    this.page = pageInfo.page;
    if (this.page == "part" || this.page == "unknownManufacturer") {
      this.activePart = pageInfo.part;
    }
  }
}

module.exports = alt.createStore(SiteStore, "SiteStore");
