# IPTVnator - web-backend

<p align="center">
  <img src="https://raw.githubusercontent.com/4gray/iptvnator/electron/src/assets/icons/favicon.256x256.png" alt="IPTVnator icon" title="Free IPTV player application" />
</p>

[IPTVnator](https://github.com/4gray/iptvnator) is a free cross-platform application for playing m3u(8) playlists. The player is [available](https://github.com/4gray/iptvnator/releases) as a standalone application for Linux, macOS and Windows and as a PWA directly from your browser.

This repository contains the backend part of the player for self-hosted version of the application. In this way it is possible to deploy IPTVnator on your own device, e.g. NAS or Raspberry Pi. For easy deployment the main repository contains a [docker-compose](https://github.com/4gray/iptvnator/tree/electron/docker) file which allows you to quickly start the containers of frontend and backend applications.

## Development

    $ npm install
    $ npm start

## Docker

    $ docker build -t 4gray/iptvnator-backend .
    $ docker run -p 3333:3000 -e CLIENT_URL=http://localhost:4333 4gray/iptvnator-backend # adapt ports if needed
