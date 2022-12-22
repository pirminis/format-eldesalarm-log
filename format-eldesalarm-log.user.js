// ==UserScript==
// @name         Format eldesalarm log
// @namespace    https://github.com/pirminis/format-eldesalarm-log
// @version      0.0.4
// @description  Automatically format, sort eldesalarm log
// @author       pirminis
// @match        https://gates.eldesalarms.com/en/gatesconfig/settings/getlog/ajax/*/device_id/*/filename/*_device.log/view/*.html
// @updateURL    https://github.com/pirminis/format-eldesalarm-log/raw/master/format-eldesalarm-log.user.js
// @downloadURL  https://github.com/pirminis/format-eldesalarm-log/raw/master/format-eldesalarm-log.user.js
// ==/UserScript==

(function(global) {
  'use strict';

  const dataSplitPattern = /^(\d{4}\.\d{2}\.\d{2}\s\d{2}:\d{2}:\d{2})\s(.*):(\+\d+)$/;
  const authFailurePattern = /Auth\. failed/;

  let body = document.getElementsByTagName('body')[0];
  let text = body.innerText;
  let lines = text.split("\n");
  let normalizedLines = [];
  let linesForSorting = [];
  let content = '';
  let skipIndex = false;
  let checkValue = 1;

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].match(authFailurePattern)) {
      normalizedLines.push(lines[i].toString());
      skipIndex = !skipIndex;
      continue;
    }

    checkValue = skipIndex ? 0 : 1;

    if (i % 2 == checkValue) {
      continue;
    }

    normalizedLines.push(lines[i].toString() + lines[i + 1].toString());
  }

  for (let i = 0; i < normalizedLines.length; i++) {
    let match = normalizedLines[i].match(dataSplitPattern);

    linesForSorting.push({ date: match[1], text: match[2], phone: match[3] });
  }

  linesForSorting.sort(compareDates);

  for (let i = 0; i < linesForSorting.length; i++) {
    content += `
      <tr>
        <td>${linesForSorting[i].date}</td>
        <td>${linesForSorting[i].text}</td>
        <td>${linesForSorting[i].phone}</td>
      </tr>
    `
  }

  let output = `
    <style>
      table {
        border-collapse: collapse;
      }
      table, th, td {
        font-family: monospace;
        border: 1px solid black;
        padding: 3px 8px;
      }
    </style>

    <table>
      <thead>
        <tr>
          <th>Date (UTC)</th>
          <th>Text</th>
          <th>Phone number</th>
        </tr>
      </thead>
      <tbody>
        ${content}
      </tbody>
    </table>
  `;

  body.innerHTML = output;

  function compareDates(a, b) {
    if (a.date < b.date) {
      return -1;
    }

    if (a.date > b.date) {
      return 1;
    }

    return 0;
  }
})(window);
