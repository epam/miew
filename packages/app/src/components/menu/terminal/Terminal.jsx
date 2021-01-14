import React, { useEffect, useRef } from 'react';
import $ from 'jquery';
import 'jquery.terminal';
import classNames from 'classnames';

import './Terminal.scss';

const Terminal = ({ viewer, isTerminalVisible }) => {
  const ref = useRef();
  let terminal;

  function onInit(term) {
    if (viewer) {
      const colors = {
        error: '#f00',
        warn: '#990',
        report: '#1a9cb0',
      };
      const onLogMessage = function (e) {
        const msg = e.message.replace('[', '(').replace(']', ')'); // temp workaround for https://github.com/jcubic/jquery.terminal/issues/470
        term.echo(`[[b;${colors[e.level] || '#666'};]${msg}]`);
      };
      viewer.logger.addEventListener('message', onLogMessage);
    }
  }

  const terminalConfig = {
    greetings: 'Miew - 3D Molecular Viewer\nCopyright © 2015-2020 EPAM Systems, Inc.\n',
    prompt: 'miew> ',
    name: 'miew',
    scrollOnEcho: true,
    height: '100%',
    keydown(event, _term) {
      if (event.keyCode === 192) { // skip '~'
        return false;
      }
      return undefined;
    },
    onInit,
  };

  function onLoad(command, term) {
    const urlSubString = command.substr(command.indexOf('-f') + 2);
    const res = urlSubString.match(/(?:"([^"]*)"|'([^']*)')/);
    if (urlSubString !== '') {
      if (res !== null && res[0] === urlSubString.trim() && res[1].indexOf('.nc') === (res[1].length - 3)) {
      // element.click();
      } else {
        term.error('You can use only URL string to *.nc file to determine trajectory');
      }
    } else {
      // res = null;
      // element.click();
    }
  }

  function handleCommand(command, term) {
    command = command.trim();
    const loadStr = command.split(/\s+/);
    if (loadStr[0] === 'load' && loadStr[1] === '-f') {
      onLoad(command, term);
    } else {
      viewer.script(command, (str) => {
        term.echo(str);
      }, (str) => {
        term.error(str);
      });
    }
  }

  useEffect(() => {
    terminal = $(ref.current);
    terminal.terminal((command, term) => {
      if (viewer) {
        handleCommand(command, term);
      } else {
        term.error('Miew is not initialized.');
      }
    }, terminalConfig);
    return () => {
      terminal.destroy();
    };
  }, [viewer]);

  return <div ref={ref} className={classNames('terminal', { 'terminal-hidden': !isTerminalVisible })}/>;
};

export default Terminal;
