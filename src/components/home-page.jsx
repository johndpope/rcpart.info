import React from "react";

import PartSearch from "./part-search";

export default class HomePage extends React.Component {
  constructor() {
    super();
    this.render = this.render.bind(this);
  }

  render() {
    return (<div>
              <h2>Search for parts on RCPart.Info</h2>
              <PartSearch history={this.props.history} />
            </div>);
  }
}
HomePage.propTypes = {
  history: React.PropTypes.object
}
