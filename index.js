const express = require("express");
const app = express();
const parser = require("iptv-playlist-parser");
const epgParser = require("epg-parser");
const axios = require("axios");
const cors = require("cors");
const zlib = require("zlib");

const isDev = process.env.NODE_ENV === "dev";
const originUrl = process.env.CLIENT_URL
  ? process.env.CLIENT_URL
  : isDev
  ? "http://localhost:4200"
  : "https://iptvnator.vercel.app";

console.log(`Development mode: ${isDev}`);
console.log(`Origin URL: ${originUrl}`);

const corsOptions = {
  origin: originUrl,
  optionsSuccessStatus: 200,
};

const https = require("https");
const agent = new https.Agent({
  rejectUnauthorized: false,
});

app.get("/", (req, res) => res.send("Hello world"));

app.get("/parse", cors(corsOptions), async (req, res) => {
  const { url } = req.query;
  if (isDev) console.log(url);
  if (!url) return res.status(400).send("Missing url");
  const result = await handlePlaylistParse(url);
  if (result.status) {
    return res.status(result.status).send(result.message);
  }
  return res.send(result);
});

app.get("/parse-xml", cors(corsOptions), async (req, res) => {
  const { url } = req.query;
  console.log(url);
  if (!url) return res.status(400).send("Missing url");
  const result = await fetchEpgDataFromUrl(url);
  if (result.status === 500) {
    return res.status(result.status).send(result.message);
  }
  return res.send(result);
});

app.get("/xtream", cors(corsOptions), async (req, res) => {
  const xtreamApiPath = "/player_api.php";
  axios
    .get(req.query.url + xtreamApiPath, {
      params: req.query ?? {},
    })
    .then((result) => {
      return res.send({
        payload: result.data,
        action: req.query?.action,
      });
    })
    .catch((err) => {
      return res.send({
        message: err.response?.statusText ?? "Error: not found",
        status: err.response?.status ?? 404,
      });
    });
});

const epgLoggerLabel = "[EPG Worker]";

/**
 * Fetches the epg data from the given url
 * @param epgUrl url of the epg file
 */
const fetchEpgDataFromUrl = (epgUrl) => {
  try {
    let axiosConfig = {};
    if (epgUrl.endsWith(".gz")) {
      axiosConfig = {
        responseType: "arraybuffer",
      };
    }
    return axios
      .get(epgUrl.trim(), axiosConfig)
      .then((response) => {
        console.log(epgLoggerLabel, "url content was fetched...");
        const { data } = response;
        if (epgUrl.endsWith(".gz")) {
          console.log(epgLoggerLabel, "start unzipping...");
          const output = zlib.gunzipSync(new Buffer.from(data)).toString();
          const result = getParsedEpg(output);
          console.log(result);
          return result;
        } else {
          const result = getParsedEpg(data.toString());
          return result;
        }
      })
      .catch((err) => {
        console.log(epgLoggerLabel, err);
      });
  } catch (error) {
    console.log(epgLoggerLabel, error);
  }
};

/**
 * Parses and sets the epg data
 * @param xmlString xml file content from the fetched url as string
 */
const getParsedEpg = (xmlString) => {
  console.log(epgLoggerLabel, "start parsing...");
  return epgParser.parse(xmlString);
};

const handlePlaylistParse = (url) => {
  try {
    return axios
      .get(url, { httpsAgent: agent })
      .then((result) => {
        const parsedPlaylist = parsePlaylist(result.data.split("\n"));
        const title = getLastUrlSegment(url);
        const playlistObject = createPlaylistObject(title, parsedPlaylist, url);
        return playlistObject;
      })
      .catch((error) => {
        if (error.response) {
          return {
            status: error.response.status,
            message: error.response.statusText,
          };
        } else {
          return { status: 500, message: "Error, something went wrong" };
        }
      });
  } catch (error) {
    return error;
  }
};

/**
 * Returns last segment (part after last slash "/") of the given URL
 * @param value URL as string
 */
const getLastUrlSegment = (value) => {
  if (value && value.length > 1) {
    return value.substr(value.lastIndexOf("/") + 1);
  } else {
    return "Playlist without title";
  }
};

/**
 * Parses string based array to playlist object
 * @param m3uArray m3u playlist as array with strings
 */
const parsePlaylist = (m3uArray) => {
  const playlistAsString = m3uArray.join("\n");
  return parser.parse(playlistAsString); //.channels[0];
};

const guid = () => {
  return Math.random().toString(36).slice(2);
};

const createPlaylistObject = (name, playlist, url) => {
  return {
    id: guid(),
    _id: guid(),
    filename: name,
    title: name,
    count: playlist.items.length,
    playlist: {
      ...playlist,
      items: playlist.items.map((item) => ({
        id: guid(),
        ...item,
      })),
    },
    importDate: new Date().toISOString(),
    lastUsage: new Date().toISOString(),
    favorites: [],
    autoRefresh: false,
    url,
  };
};

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Server running on ${port}, http://localhost:${port}`)
);
