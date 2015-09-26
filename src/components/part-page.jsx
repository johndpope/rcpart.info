import React from "react";

import Button from "react-bootstrap/lib/Button";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import OverlayTrigger from "react-bootstrap/lib/OverlayTrigger";
import Table from "react-bootstrap/lib/Table";
import Tooltip from "react-bootstrap/lib/Tooltip";

import PartStore from "../stores/part-store";
import SiteStore from "../stores/site-store";

let STOCK_TEXT = {"in_stock": "In Stock",
                  "backordered": "Backordered",
                  "out_of_stock": "Out of Stock"}

export default class PartPage extends React.Component {
  constructor() {
    super();
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.onSiteChange = this.onSiteChange.bind(this);
    this.onPartChange = this.onPartChange.bind(this);
    this.state = {"partID": null,
                  "parts": null};
  }

  componentDidMount() {
    this.onSiteChange(SiteStore.getState());
    SiteStore.listen(this.onSiteChange);
    this.onPartChange(PartStore.getState());
    PartStore.listen(this.onPartChange);
  }

  componentWillUnmount() {
    SiteStore.unlisten(this.onSiteChange);
    PartStore.unlisten(this.onPartChange);
  }

  onSiteChange(state) {
    if (state.activePart) {
      this.setState({"partID": state.activePart});
    }
  }

  onPartChange(state) {
    this.setState({"parts": state.parts});
  }

  static getSite(url) {
    var parser = document.createElement("a");
    parser.href = url;
    return parser.hostname.replace("www.", "");
  }

  static trackOutboundLink(url, redirect) {
    ga("send", "event", "outbound", "click", url, {"hitCallback":
      function () {
        if (redirect) {
          document.location = url;
        }
      }
    });
  }

  onClick(url, event) {
    let redirect = !event.ctrlKey && !event.metaKey && event.nativeEvent.button === 0;
    PartPage.trackOutboundLink(url, redirect);
    if (redirect) {
      if (event.preventDefault) {
        event.preventDefault();
      } else {
        event.returnValue = !1;
      }
    }
  }

  render() {
    if (!this.state.partID || !this.state.parts || !this.state.parts[this.state.partID.path]) {
      return <div>Loading...</div>;
    }
    let part = this.state.parts[this.state.partID.path];

    // Convert to variants.
    let variants;
    if (!part["version"]) {
      variants = [];
      for (let i = 0; i < part.urls["store"].length; i++) {
        let url = part.urls["store"][i];
        variants.push({"url": url});
      }
    } else {
      variants = part.variants;
    }
    let variants_by_site = {};
    for (let i = 0; i < variants.length; i++) {
      let url = variants[i].url;
      let site = PartPage.getSite(url);
      if (!(site in variants_by_site)) {
        variants_by_site[site] = [];
      }
      variants_by_site[site].push(variants[i]);
    }
    let content = [];
    for (let site of Object.keys(variants_by_site)) {
      let url = "http://" + site;
      content.push((
        <tr key={site}>
          <th colSpan={5}><a href={ url } onClick={ this.onClick.bind(this, url) }>{site}</a></th>
        </tr>));
      for (let i = 0; i < variants_by_site[site].length; i++) {
        let variant = variants_by_site[site][i];
        let url = variant.url;
        let description;
        if (variant.description) {
          description = variant.description;
        } else {
          description = <span className="unknown">Unknown</span>;
        }
        let quantity;
        if (variant.quantity) {
          quantity = <span className="known">{variant.quantity}</span>;
        } else {
          quantity = <span className="unknown">1</span>;
        }
        let price_per_unit;
        if (variant.price) {
          price_per_unit = <span className="known">{variant.price}</span>;
        } else {
          price_per_unit = <span className="unknown">$$</span>;
        }
        let stock;
        if (variant.stock_state) {
          let stock_text;
          if (variant.stock_text) {
            stock_text = variant.stock_text;
          } else {
            stock_text = STOCK_TEXT[variant.stock_state];
          }
          stock = <span className={ variant.stock_state }>{stock_text}</span>;
        } else {
          stock = <span className="unknown">Unknown</span>;
        }
        let timestamp;
        if (variant.timestamp) {
          let tooltip = <Tooltip id={ "timestamp-" + variant.url }>{ variant.timestamp }</Tooltip>;
          timestamp = (<OverlayTrigger overlay={tooltip} placement="left" trigger="click"><Glyphicon glyph="time"/></OverlayTrigger>);
        } else {
          timestamp = (<span className="unknown"><Glyphicon glyph="time"/></span>);
        }
        let callback = this.onClick.bind(this, url);
        content.push((
          <tr key={ site + i }>
            <td><a href={url} onClick={ callback }>{ description }</a></td>
            <td><a href={url} onClick={ callback }>{ quantity }</a></td>
            <td><a href={url} onClick={ callback }>{ price_per_unit }</a></td>
            <td><a href={url} onClick={ callback }>{ stock }</a></td>
            <td className="crawl-timestamp">{timestamp}</td>
          </tr>));
      }
    }
    let variant_table = (<Table condensed hover id="part-variants" striped>
    <thead>
      <tr>
        <th>Descripton</th>
        <th>Quantity</th>
        <th>Total Price</th>
        <th>Stock</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      { content }
    </tbody>
    </Table>);
    return (<div><h1>{part.manufacturer + " " + part.name}</h1>{variant_table}</div>)
  }
}
