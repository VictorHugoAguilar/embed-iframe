// create a load function for wait the page print everything before the use of
// the scripts, where is all the logic of the iframe
const onLoad = function onLoad() {
  // var output for messages
  const output = document.getElementById('output');

  // messages for print on iframe
  const messageOk = 'everything works fine';
  const messageKo = 'data are not saved on storage or they are empty';

  // send message by postmessage
  function sendMessage(data) {
    const locationOrigin = document.referrer || window.parent.origin;
    if (locationOrigin.includes(loginCoexistenceOrigin)) {
      window.parent.postMessage(data, loginCoexistenceOrigin);
    } else {
      const titleStyle =
        'color: #ff025a; font-size:1.5rem; margin: 1rem auto; font-family: Rockwell, Tahoma, "Trebuchet MS", Helvetica; font-weight: bold; text-shadow: 1px 1px 1px #333;';
      const messageStyle = 'color: #ff025a';
      const flame = String.fromCodePoint(0x1f525);
      // eslint-disable-next-line no-console
      console.log(
        `\n%c${flame} Postmessage Failed ${flame}%c \nThe configuration is not valid for sending postmessages. You need to change the property of loginCoexistenceOrigin with ${locationOrigin} if you really want to send the message. Thank you!\n`,
        titleStyle,
        messageStyle
      );
    }
  }

  // callback function to inform parent that the storage has failed
  function errorCb() {
    if (window.parent) {
      sendMessage({ eventName: 'resource-failed' });
      // eslint-disable-next-line no-console
      console.log(messageKo);
    }
  }

  // for fixing newer Safari versions with sessionStorage
  // userAgent response examples:
  // Safari: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15
  // Chrome: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36
  function getBrowser() {
    const { userAgent } = navigator;
    let browserName = 'No browser detection';
    let browserVersion = '-';

    if (userAgent.match(/chrome|chromium|crios/i)) {
      browserName = 'chrome';
      const version = userAgent.split(/Chrome\//g)[1].split(/[.]/);
      [browserVersion] = version;
    } else if (userAgent.match(/firefox|fxios/i)) {
      browserName = 'firefox';
      const version = userAgent.split(/Firefox\//g)[1].split(/[.]/);
      [browserVersion] = version;
    } else if (userAgent.match(/safari/i)) {
      browserName = 'safari';
      const version = userAgent.split(/Version\//g)[1].split(/[.]/);
      [browserVersion] = version;
    } else if (userAgent.match(/opr\//i)) {
      browserName = 'opera';
    } else if (userAgent.match(/edg/i)) {
      browserName = 'edge';
    }
    return { browserName, browserVersion };
  }

  // callback function to inform parent that storage was succesfull
  function sourceLoaded() {
    if (window.parent) {
      sendMessage({ eventName: 'resource-loaded' });
      // eslint-disable-next-line no-console
      console.log(messageOk);
    }
  }
  // function to validate the parent is who is suposed to be, we check if the origin is the same
  function canStoreData(consumerId, origin) {
    // the aap must be the same as the one we received
    if (consumerId !== aap) {
      return false;
    }
    // check that the origin of the iframe is the same as the one we received
    if (origin !== loginCoexistenceOrigin) {
      return false;
    }
    return true;
  }

  // Check if exist bbvaBtgeLoginUserInfo and is not equals that legacy value
  function checkBbvaBtgeLoginUserInfo() {
    return (
      typeof bbvaBtgeLoginUserInfo !== 'undefined' &&
      bbvaBtgeLoginUserInfo !== 'bbvaBtgeLoginUserInfo'
    );
  }

  function saveDataInSessionStorage(tsec, consumerId, loginUserInfo) {
    // store the tsec
    sessionStorage.setItem('tsec', tsec);
    sessionStorage.setItem('consumerId', consumerId);

    if (checkBbvaBtgeLoginUserInfo()) {
      // save in to sessionStorage the user information
      sessionStorage.setItem(
        bbvaBtgeLoginUserInfo,
        JSON.stringify(loginUserInfo)
      );
    }
    // save in to sessionStorage the user information for legacy option
    sessionStorage.setItem(
      'bbvaBtgeLoginUserInfo',
      JSON.stringify(loginUserInfo)
    );
  }

  function saveDataInLocalStorage(tsec, consumerId, loginUserInfo) {
    // store the tsec
    localStorage.setItem('tsec', tsec);
    localStorage.setItem('consumerId', consumerId);

    if (checkBbvaBtgeLoginUserInfo()) {
      // save in to localStorage the user information
      localStorage.setItem(
        bbvaBtgeLoginUserInfo,
        JSON.stringify(loginUserInfo)
      );
    }
    // save in to localStorage for legacy option
    localStorage.setItem(
      'bbvaBtgeLoginUserInfo',
      JSON.stringify(loginUserInfo)
    );
  }

  /**
   * Clear session storage
   */
  function clearDataInSessionStorage() {
    sessionStorage.removeItem('tsec');
    sessionStorage.removeItem('consumerId');

    if (checkBbvaBtgeLoginUserInfo()) {
      // remove of sessionStorage the user information
      sessionStorage.removeItem(bbvaBtgeLoginUserInfo);
    }
    // remove of sessionStorage for legacy option
    sessionStorage.removeItem('bbvaBtgeLoginUserInfo');
  }

  /**
   * Clear localStorage
   */
  function clearDataInLocalStorage() {
    localStorage.removeItem('tsec');
    localStorage.removeItem('consumerId');

    if (checkBbvaBtgeLoginUserInfo()) {
      // remove of localStorage the user information
      localStorage.removeItem(bbvaBtgeLoginUserInfo);
    }
    // remove of localStorage for legacy option
    localStorage.removeItem('bbvaBtgeLoginUserInfo');
  }

  // to store the passed data in seesion storage
  // store the tsec for the user autentication
  // store the user information in other object because it is needed also
  // on error we inform the parent
  function storeData({ data }) {
    try {
      // get the data for the object sent by the parent
      const {
        tsec,
        consumerId,
        origin,
        code,
        user,
        profileId,
        relatedPersonId,
        referenceDocument,
        country,
        referenceClientId,
      } = data;

      // check if the parent is who is suposed to be
      if (canStoreData(consumerId, origin)) {
        const { browserName, browserVersion } = getBrowser();
        const loginUserInfo = {
          code,
          user,
          profileId,
          relatedPersonId,
          referenceDocument,
          country,
          referenceClientId,
        };

        try {
          // to fix the problem with safari (>=14), saving the data in localStorage instead sessionStorage
          if (browserName === 'safari' && parseInt(browserVersion, 10) >= 14) {
            saveDataInLocalStorage(tsec, consumerId, loginUserInfo);
          } 
          if (browserName === 'firefox' ) {
            console.log(`🚧 store data in storage: ${loginUserInfo}`);
            saveDataInSessionStorage(tsec, consumerId, loginUserInfo);
            saveDataInLocalStorage(tsec, consumerId, loginUserInfo);

            sendMessage({ eventName: 'resource-waiting-redirection' });
            return;
          }
          // inform parent that the storage has been completed
          sourceLoaded(origin);
        } catch (err) {
          console.log(`🚧 store error catch: ${err}`);

          saveDataInSessionStorage(tsec, consumerId, loginUserInfo);
          // inform parent that the storage has been completed
          sourceLoaded(origin);
        }
      } else {
        console.log(`🚧 inform the parent that is not allowed to store the origin and the aap must match`);

        // inform the parent that is not allowed to store the origin and the aap must match
        errorCb(origin);
      }
    } catch (error) {
      console.log(`🚧 store parent error catch: ${err}`);

      // inform the parent that there was an error storing the data
      errorCb(origin);
    }
  }

  /**
   * Clean data of session o local storage
   */
  function clearData() {
    try {
      const { browserName, browserVersion } = getBrowser();
      // to fix the problem with safari (>=14), saving the data in localStorage instead sessionStorage
      if (browserName === 'safari' && parseInt(browserVersion, 10) >= 14) {
        clearDataInLocalStorage();
      } else {
        clearDataInSessionStorage();
      }
    } catch (err) {
      clearDataInSessionStorage();
    }
  }

  /**
   * Method that manages the data to store or clean the data from the session storage
   * @param {*} event
   */
  function managerData({ data }) {
    // eslint-disable-next-line no-console
    console.log(`🚧 listening to messages from the parent with the data: ${data}`);
    if (data && data.data && !data.data.clear && !data.data.redirectToSendaUrl) {
      storeData(data);
    } else if (data && data.data && data.data.clear && !data.data.redirectToSendaUrl) {
      clearData();
    }  else if (data && data.data && data.data.redirectToSendaUrl) {
      const { data : { redirectToSendaUrl } } = data;
      window.open(redirectToSendaUrl);
      sendMessage({ eventName: 'resource-closed' });
    } 
  }

  // Listen post message from parent.
  window.addEventListener('message', managerData, false);

  // Send ready message to parent.
  sendMessage({ eventName: 'iframe-ready' });

  // simulate click for button KO and button OK
  document.querySelector('#success-btn').addEventListener('click', e => {
    e.preventDefault();
    sourceLoaded();
  });

  document.querySelector('#fail-btn').addEventListener('click', e => {
    e.preventDefault();
    errorCb();
  });
};

// print data when an event is received
window.addEventListener('load', onLoad);ﬁ
