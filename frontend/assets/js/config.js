(function () {
  const DEPLOYED_API_BASE_URL = "https://whatbytes-999t.onrender.com";
  const LOCAL_API_BASE_URL = "http://127.0.0.1:8000/api";

  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  window.APP_CONFIG = {
    API_BASE_URL: isLocalHost ? LOCAL_API_BASE_URL : DEPLOYED_API_BASE_URL
  };
})();
