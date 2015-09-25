import React from "react";

import RCPartInfo from "./components/rcpart.info.jsx";
import AllParts from "./components/all-parts";
import PartPage from "./components/part-page";
import HomePage from "./components/home-page";
import SupportedParts from "./components/supported-parts";

import SiteActions from "./actions/site-actions";

import Router from "react-router";
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var Redirect = Router.Redirect;

var routes = (
  <Route handler={RCPartInfo} name="home" path="/">
    <DefaultRoute handler={HomePage}/>
    <Route handler={PartPage} name="part" path="part/:manufacturer/:part" />
    <Route handler={PartPage} name="unknownManufacturer" path="part/UnknownManufacturer/:site/:part" />
    <Route handler={SupportedParts} name="supportedparts" path="parts/supported" />
    <Route handler={AllParts} name="allparts" path="parts/all" />
  </Route>);

Router.run(routes, Router.HistoryLocation, (Root, state) => {
  React.render(<Root/>, document.body);
  SiteActions.navigateToPage(state);
  let pageview = {"page": state.path};
  ga("send", "pageview", pageview);
});
