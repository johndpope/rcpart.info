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

import { Router, Link } from "react-router";

import Cookies from "js-cookie";

import SiteActions from "../actions/site-actions";
import SiteStore from "../stores/site-store";
import PartSearch from "./part-search";

export default class RCPartInfo extends React.Component {
  constructor() {
    super();
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillReceiveProps = this.componentWillReceiveProps.bind(this);
    this.lastPath = null;
  }

  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(props) {
    SiteActions.navigateToPage(props.routes, props.params);
    let pageview = { "page": props.location.pathname };
    ga("send", "pageview", pageview);
  }

  render() {
    var logo = <Link to="/"><img src="/static/logo.svg"/></Link>;

    return (
      <div id="appContainer">
        <Navbar brand={logo}>
          <Nav right>
            <NavItem>
              <PartSearch history={this.props.history} id="navSearch"/>
            </NavItem>
          </Nav>
        </Navbar>
        <Grid>
          <Row>
            <Col xs={12}>
              { this.props.children }
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
RCPartInfo.propTypes = {
  children: React.PropTypes.node,
  history: React.PropTypes.object
}
