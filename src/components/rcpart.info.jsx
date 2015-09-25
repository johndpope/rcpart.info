require("babelify/polyfill");

var React = require("react");
var Grid = require("react-bootstrap/lib/Grid");
var Row = require("react-bootstrap/lib/Row");
var Col = require("react-bootstrap/lib/Col");
var MenuItem = require("react-bootstrap/lib/MenuItem");
var Navbar = require("react-bootstrap/lib/Navbar");
var CollapsibleNav = require("react-bootstrap/lib/CollapsibleNav");
var Nav = require("react-bootstrap/lib/Nav");
var NavItem = require("react-bootstrap/lib/NavItem");

import Router from "react-router";
var RouteHandler = Router.RouteHandler;
var Link = Router.Link;

import MenuItemLink from "react-router-bootstrap/lib/MenuItemLink";
import NavItemLink from "react-router-bootstrap/lib/NavItemLink";

import Cookies from "js-cookie";

import SiteActions from "../actions/site-actions";
import SiteStore from "../stores/site-store";

export default class RCPartInfo extends React.Component {
  constructor() {
    super();
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.onSiteChange = this.onSiteChange.bind(this);
    this.state = SiteStore.getState();
  }

  componentDidMount() {
    SiteStore.listen(this.onSiteChange);
  }

  componentWillUnmount() {
    SiteStore.unlisten(this.onSiteChange);
  }

  onSiteChange(state) {
    this.setState(state);
  }

  render() {
    var logo = <Link to="home"><img src="/static/logo.svg"/></Link>;

    return (
      <div id="appContainer">
        <Navbar brand={logo}/>
        <Grid>
          <Row>
            <Col xs={12}>
              <RouteHandler/>
            </Col>
          </Row>
          <hr/>
          <Row>
            <Col xs={12}>
              Site by <a href="http://tannewt.org">tannewt</a>. Code on <a href="https://github.com/rcbuild-info/rcpart.info">GitHub</a>. <span className="disclaimer">RCPart.Info is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to amazon.com.</span>
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}
