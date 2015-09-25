import React from "react";

import RCPartInfo from "./components/rcpart.info.jsx";
import AllParts from "./components/all-parts";
import PartPage from "./components/part-page";
import HomePage from "./components/home-page";
import SupportedParts from "./components/supported-parts";

import SiteActions from "./actions/site-actions";

import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute } from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';

var routes = (
  <Route component={RCPartInfo} path="/">
    <IndexRoute component={HomePage}/>
    <Route component={PartPage} path="part/:manufacturer/:part" />
    <Route component={PartPage} path="part/UnknownManufacturer/:site/:part" />
    <Route component={SupportedParts} path="parts/supported" />
    <Route component={AllParts} path="parts/all" />
  </Route>);

let history = createBrowserHistory();
ReactDOM.render(<Router history={history}>{routes}</Router>, document.getElementById("rcpart"));
