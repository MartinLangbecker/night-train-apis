window.onload = function() {
  //<editor-fold desc="Changeable Configuration Block">

  // the following lines will be replaced by docker/configurator, when it runs in a docker-container
  window.ui = SwaggerUIBundle({
    urls: [{url: "european-sleeper-api.yaml", name: "European Sleeper"}, {url: "leo-express-api.yaml", name: "Leo Express"}, {url: "nightjet-api.yaml", name: "NightJet"}, {url: "rdc-euronight-api.yaml", name: "RDC EuroNight"}, {url: "sj-api.yaml", name: "SJ"}, {url: "snalltaget-api.yaml", name: "Snälltåget"}],
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  });

  //</editor-fold>
};
