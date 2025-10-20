import React from 'react';

import GitHubForkRibbon from 'react-github-fork-ribbon';
import './AboutPanel.scss';

const AboutPanel = ({ version }) => (
  <div className="about-panel">
    <div className="git-hub-container">
      <GitHubForkRibbon href="https://github.com/epam/miew" target="_blank" position="left">
        Fork me on GitHub
      </GitHubForkRibbon>
    </div>
    <div className="miew-info">
      <img src="images/logo.svg"></img>
      <h3 className="miew-name">Miew – 3D Molecular Viewer </h3>
      <p>{version}</p>
      <p>Copyright © 2015–2025 EPAM Systems, Inc.</p>
      <p>
        <a href="https://epa.ms/miew">https://epa.ms/miew</a>
      </p>
    </div>
    <h2>Keyboard and mouse shortcuts</h2>
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Key</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan="2">
            <b>Camera and object controls</b>
          </td>
        </tr>
        <tr>
          <td>
            <kbd>LMB</kbd>
          </td>
          <td>Click to select object part</td>
        </tr>
        <tr>
          <td></td>
          <td>Double click to change object rotation center</td>
        </tr>
        <tr>
          <td></td>
          <td>Drag to rotate object in 3D</td>
        </tr>
        <tr>
          <td>
            <kbd>Shift</kbd> + <kbd>LMB</kbd>
          </td>
          <td>Drag to rotate object in Z plane</td>
        </tr>
        <tr>
          <td>
            <kbd>Mouse Wheel</kbd>
          </td>
          <td>Scale object</td>
        </tr>
        <tr>
          <td>
            <kbd>RMB</kbd>
          </td>
          <td>Drag to shift molecule</td>
        </tr>

        <tr>
          <td colSpan="2">
            <b>Component / fragment edit mode</b>
          </td>
        </tr>
        <tr>
          <td>
            <kbd>C</kbd> / <kbd>F</kbd>
          </td>
          <td>Enter the component or fragment edit mode</td>
        </tr>
        <tr>
          <td>
            <kbd>A</kbd> / <kbd>D</kbd>
          </td>
          <td>Apply or discard changes</td>
        </tr>
        <tr>
          <td>
            <kbd>Alt</kbd> + <kbd>LMB</kbd>
          </td>
          <td>Drag to rotate component / fragment in 3D</td>
        </tr>
        <tr>
          <td>
            <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>LMB</kbd>
          </td>
          <td>Drag to rotate component / fragment in Z plane</td>
        </tr>
        <tr>
          <td>
            <kbd>Alt</kbd> + <kbd>Ctrl</kbd> + <kbd>LMB</kbd>
          </td>
          <td>Drag to translate component in Z plane</td>
        </tr>
        <tr>
          <td colSpan="2">
            <b>Other</b>
          </td>
        </tr>
        <tr>
          <td>
            <kbd>X</kbd>
          </td>
          <td>Extract selection as a new representation</td>
        </tr>
      </tbody>
    </table>
  </div>
);

export default AboutPanel;
