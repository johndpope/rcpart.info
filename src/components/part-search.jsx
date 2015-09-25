import React from "react";

import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";

import Autosuggest from "react-autosuggest";

import PartStore from "../stores/part-store";

export default class PartSearch extends React.Component {
  constructor() {
    super();
    this.getSuggestions = this.getSuggestions.bind(this);
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.onPartChange = this.onPartChange.bind(this);
    this.onChange = this.onChange.bind(this);
    this.state = {
      categories: {},
      supportedParts: {},
      unsupportedParts: {},
      value: ""
    };
  }

  componentDidMount() {
    PartStore.listen(this.onPartChange);
  }

  componentWillUnmount() {
    PartStore.unlisten(this.onPartChange);
  }

  onPartChange(state) {
    this.setState({"categories": state.categories,
                   "supportedParts": state.supportedParts,
                   "unsupportedParts": state.unsupportedParts});
  }

  onChange(value) {
    this.setState({"value": value});
  }

  suggestionRenderer(suggestion) { // also gets input
    return suggestion.name;
  }

  suggestionValue(suggestion) {
    return (suggestion.manufacturer + " " + suggestion.name).trim();
  }

  onSuggestionSelected(suggestion) {
    this.props.history.pushState(null, `/part/${suggestion.id}`);
    this.setState({"value": ""});
  }

  static sortByPartName(a, b) {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    }
    return 0;
  }

  static sortByGroupName(a, b) {
    if (a.sectionName < b.sectionName) {
      return -1;
    } else if (a.sectionName > b.sectionName) {
      return 1;
    }
    return 0;
  }

  getSuggestionsHelper(groupSuffix, parts, input, regex) {
    var suggestions = [];
    for (let manufacturerID of Object.keys(parts)) {
      let group = {sectionName: null, suggestions: []};
      for (let partID of Object.keys(parts[manufacturerID])) {
        let part = parts[manufacturerID][partID];
        if (input.length === 0 || regex.test(part.fullName)) {
          if (group.sectionName === null) {
            if (part.manufacturer === "") {
              group.sectionName = manufacturerID;
            } else {
              group.sectionName = part.manufacturer;
            }
            if (groupSuffix) {
              group.sectionName += " - " + groupSuffix;
            }
          }
          group.suggestions.push(part);
        }
      }
      if (group.sectionName) {
        group.suggestions.sort(PartSearch.sortByPartName);
        suggestions.push(group);
      }
    }
    suggestions.sort(PartSearch.sortByGroupName);
    return suggestions;
  }

  getSuggestions(input, callback) {
    const regex = new RegExp(input, "i");
    var supportedSuggestions = [];
    if (this.state.supportedParts) {
      for(let category of Object.keys(this.state.supportedParts)) {
        let categoryName = category;
        if (category in this.state.categories) {
          categoryName = this.state.categories[category].name;
        }
        let categorySuggestions = this.getSuggestionsHelper(categoryName, this.state.supportedParts[category], input, regex);
        Array.prototype.push.apply(supportedSuggestions, categorySuggestions);
      }
      supportedSuggestions.sort(PartSearch.sortByGroupName);
      callback(null, supportedSuggestions);
    }
    if (this.state.unsupportedParts &&
        (input.length >= 4 || supportedSuggestions.length === 0)) {
      let unsupportedSuggestions = this.getSuggestionsHelper("Unknown Category", this.state.unsupportedParts, input, regex);
      callback(null, supportedSuggestions.concat(unsupportedSuggestions));
    }
  }

  // Determines when to show suggestions.
  showWhen() {
    return true;
  }

  // TODO(tannewt): use shouldComponentupdate to prevent render when
  // this.props.supportedParts is updated.

  render() {
    var inputAttributes = {
      placeholder: "Search"
    };
    return (<Autosuggest id={this.props.id}
                         inputAttributes={inputAttributes}
                         onChange={this.onChange}
                         onSuggestionSelected={this.onSuggestionSelected}
                         showWhen={this.showWhen}
                         suggestionRenderer={this.suggestionRenderer}
                         suggestionValue={this.suggestionValue}
                         suggestions={this.getSuggestions}
                         value={this.state.value}/>);
  }
}
PartSearch.propTypes = {
  history: React.PropTypes.object,
  id: React.PropTypes.string
};
