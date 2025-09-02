// ==UserScript==
// @name         Format eldesalarm log
// @namespace    https://github.com/pirminis/format-eldesalarm-log
// @version      0.0.5
// @description  Automatically format and sort an eldesalarm log
// @author       pirminis
// @match        https://gates.eldesalarms.com/en/gatesconfig/settings/getlog/ajax/*/device_id/*/filename/*_device.log/view/*.html
// @updateURL    https://github.com/pirminis/format-eldesalarm-log/raw/master/format-eldesalarm-log.user.js
// @downloadURL  https://github.com/pirminis/format-eldesalarm-log/raw/master/format-eldesalarm-log.user.js
// ==/UserScript==

(function(_global) {
  'use strict';

  const callPattern = /^(\d{4}\.\d{2}\.\d{2}\s\d{2}:\d{2}:\d{2})\s(.*):(\+\d+)$/;
  const userAddedPattern = /^(\d{4}\.\d{2}\.\d{2}\s\d{2}:\d{2}:\d{2})\sW:\sUser\s(.+)\s\[(.+)\]\sadded in.*$/;
  const skipLineJoinPattern = /(Auth\. failed|W:)/;

  const body = document.getElementsByTagName('body')[0];
  const text = body.innerText;
  const lines = text.split("\n");
  const normalizedLines = [];
  const linesForSorting = [];
  let content = '';
  let skipIndex = false;
  let checkValue = 1;

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].match(skipLineJoinPattern)) {
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
    let match = normalizedLines[i].match(callPattern);

    if (match !== null) {
      linesForSorting.push({ date: toLocalDate(match[1]), text: match[2], phone: match[3] });
      continue;
    }

    match = normalizedLines[i].match(userAddedPattern);

    if (match !== null) {
      linesForSorting.push({ date: toLocalDate(match[1]), text: `Added user "${match[2]}"`, phone: `+${match[3]}` });
    }
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

  const output = `
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
          <th>Date (Europe/Vilnius)</th>
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

  function toLocalDate(utcDate) {
    return (new Date(utcDate.replace(/\./g, '-') + ' UTC')).toLocaleString('lt-LT', { timeZone: 'Europe/Vilnius' });
  }

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
