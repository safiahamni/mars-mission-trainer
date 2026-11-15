// ghIcons.js: Lucide icons for the greenhouse (https://lucide.dev, ISC licence, free and open source).
// The icon shapes are copied in here, so this file needs no extra install.
//   ghIcon("leaf", 24)        -> an <svg> string you can put in a template
//   watchIcons(root)          -> swaps every emoji inside `root` for its Lucide icon, now and whenever the
//                                panel re-draws. Returns a function that stops watching.
const PATHS = {
 "arrow-down": "<path d=\"M12 5v14\"/> <path d=\"m19 12-7 7-7-7\"/>",
 "arrow-left": "<path d=\"m12 19-7-7 7-7\"/> <path d=\"M19 12H5\"/>",
 "arrow-right": "<path d=\"M5 12h14\"/> <path d=\"m12 5 7 7-7 7\"/>",
 "arrow-up": "<path d=\"m5 12 7-7 7 7\"/> <path d=\"M12 19V5\"/>",
 "beaker": "<path d=\"M4.5 3h15\"/> <path d=\"M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3\"/> <path d=\"M6 14h12\"/>",
 "bean": "<path d=\"M10.165 6.598C9.954 7.478 9.64 8.36 9 9c-.64.64-1.521.954-2.402 1.165A6 6 0 0 0 8 22c7.732 0 14-6.268 14-14a6 6 0 0 0-11.835-1.402Z\"/> <path d=\"M5.341 10.62a4 4 0 1 0 5.279-5.28\"/>",
 "biohazard": "<circle cx=\"12\" cy=\"11.9\" r=\"2\"/> <path d=\"M6.7 3.4c-.9 2.5 0 5.2 2.2 6.7C6.5 9 3.7 9.6 2 11.6\"/> <path d=\"m8.9 10.1 1.4.8\"/> <path d=\"M17.3 3.4c.9 2.5 0 5.2-2.2 6.7 2.4-1.2 5.2-.6 6.9 1.5\"/> <path d=\"m15.1 10.1-1.4.8\"/> <path d=\"M16.7 20.8c-2.6-.4-4.6-2.6-4.7-5.3-.2 2.6-2.1 4.8-4.7 5.2\"/> <path d=\"M12 13.9v1.6\"/> <path d=\"M13.5 5.4c-1-.2-2-.2-3 0\"/> <path d=\"M17 16.4c.7-.7 1.2-1.6 1.5-2.5\"/> <path d=\"M5.5 13.9c.3.9.8 1.8 1.5 2.5\"/>",
 "bug": "<path d=\"M12 20v-9\"/> <path d=\"M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z\"/> <path d=\"M14.12 3.88 16 2\"/> <path d=\"M21 21a4 4 0 0 0-3.81-4\"/> <path d=\"M21 5a4 4 0 0 1-3.55 3.97\"/> <path d=\"M22 13h-4\"/> <path d=\"M3 21a4 4 0 0 1 3.81-4\"/> <path d=\"M3 5a4 4 0 0 0 3.55 3.97\"/> <path d=\"M6 13H2\"/> <path d=\"m8 2 1.88 1.88\"/> <path d=\"M9 7.13V6a3 3 0 1 1 6 0v1.13\"/>",
 "check": "<path d=\"M20 6 9 17l-5-5\"/>",
 "chevron-right": "<path d=\"m9 18 6-6-6-6\"/>",
 "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\"/> <path d=\"m16 9-5.5 5.5L8 12\"/>",
 "clipboard-check": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\"/> <path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"/> <path d=\"m9 14 2 2 4-4\"/>",
 "cloud": "<path d=\"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z\"/>",
 "cloud-fog": "<path d=\"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242\"/> <path d=\"M16 17H7\"/> <path d=\"M17 21H9\"/>",
 "container": "<path d=\"M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z\"/> <path d=\"M10 21.9V14L2.1 9.1\"/> <path d=\"m10 14 11.9-6.9\"/> <path d=\"M14 19.8v-8.1\"/> <path d=\"M18 17.5V9.4\"/>",
 "cup-soda": "<path d=\"m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8\"/> <path d=\"M5 8h14\"/> <path d=\"M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0\"/> <path d=\"m12 8 1-6h2\"/>",
 "dna": "<path d=\"m10 16 1.5 1.5\"/> <path d=\"m14 8-1.5-1.5\"/> <path d=\"M15 2c-1.798 1.998-2.518 3.995-2.807 5.993\"/> <path d=\"m16.5 10.5 1 1\"/> <path d=\"m17 6-2.891-2.891\"/> <path d=\"M2 15c6.667-6 13.333 0 20-6\"/> <path d=\"m20 9 .891.891\"/> <path d=\"M3.109 14.109 4 15\"/> <path d=\"m6.5 12.5 1 1\"/> <path d=\"m7 18 2.891 2.891\"/> <path d=\"M9 22c1.798-1.998 2.518-3.995 2.807-5.993\"/>",
 "droplet": "<path d=\"M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z\"/>",
 "flame": "<path d=\"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4\"/>",
 "flask-conical": "<path d=\"M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2\"/> <path d=\"M6.453 15h11.094\"/> <path d=\"M8.5 2h7\"/>",
 "flask-round": "<path d=\"M10 2v6.292a7 7 0 1 0 4 0V2\"/> <path d=\"M5 15h14\"/> <path d=\"M8.5 2h7\"/>",
 "germ": "<path d=\"m11 2 .925 1.848\"/> <path d=\"M13 15h.01\"/> <path d=\"m16 21-1-2.472\"/> <path d=\"m19 2-1 1.804\"/> <path d=\"m2 19 2.746-1.373\"/> <path d=\"m22 16-2.474-2.13\"/> <path d=\"m22 5-1.804 1\"/> <path d=\"m3 10 2 2\"/> <path d=\"M9 16h.01\"/> <path d=\"M9 20v2\"/> <path d=\"M9.33 7.035c-.51 1.478-1.786 2.93-3.09 3.794A5 5 0 009 20a12.1 12.1 0 0011.902-9.916A6 6 0 009.33 7.035\"/> <circle cx=\"15\" cy=\"9\" r=\"2\"/>",
 "hand": "<path d=\"M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2\"/> <path d=\"M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2\"/> <path d=\"M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8\"/> <path d=\"M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15\"/>",
 "heart-pulse": "<path d=\"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5\"/> <path d=\"M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27\"/>",
 "hourglass": "<path d=\"M5 22h14\"/> <path d=\"M5 2h14\"/> <path d=\"M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22\"/> <path d=\"M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2\"/>",
 "leaf": "<path d=\"M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20\"/> <path d=\"M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13\"/>",
 "leafy-green": "<path d=\"M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5 4 4 0 0 0 6.187-2.353 3.5 3.5 0 0 0 3.69-5.116A3.5 3.5 0 0 0 20.95 8 3.5 3.5 0 1 0 16 3.05a3.5 3.5 0 0 0-5.831 1.373 3.5 3.5 0 0 0-5.116 3.69 4 4 0 0 0-2.348 6.155C3.499 15.42 4.409 16.712 4.2 18.1 3.926 19.743 3.014 20.732 2 22\"/> <path d=\"M2 22 17 7\"/>",
 "lightbulb": "<path d=\"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5\"/> <path d=\"M9 18h6\"/> <path d=\"M10 22h4\"/>",
 "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"/> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/>",
 "orbit": "<path d=\"M20.341 6.484A10 10 0 0 1 10.266 21.85\"/> <path d=\"M3.659 17.516A10 10 0 0 1 13.74 2.152\"/> <circle cx=\"12\" cy=\"12\" r=\"3\"/> <circle cx=\"19\" cy=\"5\" r=\"2\"/> <circle cx=\"5\" cy=\"19\" r=\"2\"/>",
 "package": "<path d=\"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z\"/> <path d=\"M12 22V12\"/> <polyline points=\"3.29 7 12 12 20.71 7\"/> <path d=\"m7.5 4.27 9 5.15\"/>",
 "pause": "<rect x=\"14\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"/> <rect x=\"5\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\"/>",
 "play": "<path d=\"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z\"/>",
 "pointer": "<path d=\"M22 14a8 8 0 0 1-8 8\"/> <path d=\"M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2\"/> <path d=\"M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1\"/> <path d=\"M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10\"/> <path d=\"M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15\"/>",
 "radiation": "<path d=\"M12 12h.01\"/> <path d=\"M14 15.4641a4 4 0 0 1-4 0L7.52786 19.74597 A 1 1 0 0 0 7.99303 21.16211 10 10 0 0 0 16.00697 21.16211 1 1 0 0 0 16.47214 19.74597z\"/> <path d=\"M16 12a4 4 0 0 0-2-3.464l2.472-4.282a1 1 0 0 1 1.46-.305 10 10 0 0 1 4.006 6.94A1 1 0 0 1 21 12z\"/> <path d=\"M8 12a4 4 0 0 1 2-3.464L7.528 4.254a1 1 0 0 0-1.46-.305 10 10 0 0 0-4.006 6.94A1 1 0 0 0 3 12z\"/>",
 "recycle": "<path d=\"M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5\"/> <path d=\"M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12\"/> <path d=\"m14 16-3 3 3 3\"/> <path d=\"M8.293 13.596 7.196 9.5 3.1 10.598\"/> <path d=\"m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843\"/> <path d=\"m13.378 9.633 4.096 1.098 1.097-4.096\"/>",
 "repeat": "<path d=\"m17 2 4 4-4 4\"/> <path d=\"M3 11v-1a4 4 0 0 1 4-4h14\"/> <path d=\"m7 22-4-4 4-4\"/> <path d=\"M21 13v1a4 4 0 0 1-4 4H3\"/>",
 "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"/> <path d=\"M3 3v5h5\"/>",
 "rotate-cw": "<path d=\"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8\"/> <path d=\"M21 3v5h-5\"/>",
 "shield": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/>",
 "shopping-basket": "<path d=\"m15 11-1 9\"/> <path d=\"m19 11-4-7\"/> <path d=\"M2 11h20\"/> <path d=\"m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4\"/> <path d=\"M4.5 15.5h15\"/> <path d=\"m5 11 4-7\"/> <path d=\"m9 11 1 9\"/>",
 "shovel": "<path d=\"M21.56 4.56a1.5 1.5 0 0 1 0 2.122l-.47.47a3 3 0 0 1-4.212-.03 3 3 0 0 1 0-4.243l.44-.44a1.5 1.5 0 0 1 2.121 0z\"/> <path d=\"M3 22a1 1 0 0 1-1-1v-3.586a1 1 0 0 1 .293-.707l3.355-3.355a1.205 1.205 0 0 1 1.704 0l3.296 3.296a1.205 1.205 0 0 1 0 1.704l-3.355 3.355a1 1 0 0 1-.707.293z\"/> <path d=\"m9 15 7.879-7.878\"/>",
 "snail": "<path d=\"M2 13a6 6 0 1 0 12 0 4 4 0 1 0-8 0 2 2 0 0 0 4 0\"/> <circle cx=\"10\" cy=\"13\" r=\"8\"/> <path d=\"M2 21h12c4.4 0 8-3.6 8-8V7a2 2 0 1 0-4 0v6\"/> <path d=\"M18 3 19.1 5.2\"/> <path d=\"M22 3 20.9 5.2\"/>",
 "snowflake": "<path d=\"m10 20-1.25-2.5L6 18\"/> <path d=\"M10 4 8.75 6.5 6 6\"/> <path d=\"m14 20 1.25-2.5L18 18\"/> <path d=\"m14 4 1.25 2.5L18 6\"/> <path d=\"m17 21-3-6h-4\"/> <path d=\"m17 3-3 6 1.5 3\"/> <path d=\"M2 12h6.5L10 9\"/> <path d=\"m20 10-1.5 2 1.5 2\"/> <path d=\"M22 12h-6.5L14 15\"/> <path d=\"m4 10 1.5 2L4 14\"/> <path d=\"m7 21 3-6-1.5-3\"/> <path d=\"m7 3 3 6h4\"/>",
 "sprout": "<path d=\"M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3\"/> <path d=\"M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4\"/> <path d=\"M5 21h14\"/>",
 "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\"/> <path d=\"M12 2v2\"/> <path d=\"M12 20v2\"/> <path d=\"m4.93 4.93 1.41 1.41\"/> <path d=\"m17.66 17.66 1.41 1.41\"/> <path d=\"M2 12h2\"/> <path d=\"M20 12h2\"/> <path d=\"m6.34 17.66-1.41 1.41\"/> <path d=\"m19.07 4.93-1.41 1.41\"/>",
 "thermometer": "<path d=\"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z\"/>",
 "thermometer-sun": "<path d=\"M12 2v2\"/> <path d=\"M12 8a4 4 0 0 0-1.645 7.647\"/> <path d=\"M2 12h2\"/> <path d=\"M20 14.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z\"/> <path d=\"m4.93 4.93 1.41 1.41\"/> <path d=\"m6.34 17.66-1.41 1.41\"/>",
 "timer": "<line x1=\"10\" x2=\"14\" y1=\"2\" y2=\"2\"/> <line x1=\"12\" x2=\"15\" y1=\"14\" y2=\"11\"/> <circle cx=\"12\" cy=\"14\" r=\"8\"/>",
 "toolbox": "<path d=\"M16 12v4\"/> <path d=\"M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2\"/> <path d=\"M17 6a2 2 0 011.414.586l3 3A2 2 0 0122 11v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8a2 2 0 01.586-1.414l3-3A2 2 0 017 6z\"/> <path d=\"M2 14h20\"/> <path d=\"M8 12v4\"/>",
 "tornado": "<path d=\"M21 4H3\"/> <path d=\"M18 8H6\"/> <path d=\"M19 12H9\"/> <path d=\"M16 16h-6\"/> <path d=\"M11 20H9\"/>",
 "trash": "<path d=\"M10 11v6\"/> <path d=\"M14 11v6\"/> <path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\"/> <path d=\"M3 6h18\"/> <path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"/>",
 "triangle-exclamation-point": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"/> <path d=\"M12 9v4\"/> <path d=\"M12 17h.01\"/>",
 "utensils": "<path d=\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\"/> <path d=\"M7 2v20\"/> <path d=\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\"/>",
 "wheat": "<path d=\"M2 22 16 8\"/> <path d=\"M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"/> <path d=\"M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"/> <path d=\"M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"/> <path d=\"M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z\"/> <path d=\"M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"/> <path d=\"M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"/> <path d=\"M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"/>",
 "wrench": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z\"/>",
 "zap": "<path d=\"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z\"/>"
};

// emoji -> icon name
const EMOJI = {
 "🍃": "leaf",
 "🥬": "leafy-green",
 "🥔": "bean",
 "🌿": "leaf",
 "🌱": "sprout",
 "🪴": "sprout",
 "🌾": "wheat",
 "📦": "package",
 "🧴": "container",
 "🔧": "wrench",
 "🫙": "beaker",
 "💡": "lightbulb",
 "🧰": "toolbox",
 "☣": "biohazard",
 "☢": "radiation",
 "🍄": "cloud-fog",
 "🧤": "hand",
 "🐛": "bug",
 "🥤": "cup-soda",
 "⬆": "arrow-up",
 "➡": "arrow-right",
 "⬇": "arrow-down",
 "⬅": "arrow-left",
 "←": "arrow-left",
 "→": "arrow-right",
 "⚡": "zap",
 "⏳": "hourglass",
 "🔒": "lock",
 "🌡": "thermometer",
 "⚙": "thermometer-sun",
 "🧪": "flask-conical",
 "♻": "recycle",
 "🛡": "shield",
 "☀": "sun",
 "🌑": "cloud",
 "🔥": "flame",
 "❄": "snowflake",
 "🌪": "tornado",
 "🧺": "shopping-basket",
 "👆": "pointer",
 "⚠": "triangle-exclamation-point",
 "↻": "rotate-cw",
 "↺": "rotate-ccw",
 "✓": "check",
 "✔": "check",
 "✅": "circle-check",
 "🥄": "shovel",
 "🧫": "flask-round",
 "⏸": "pause",
 "▶": "play",
 "🧬": "dna",
 "🦠": "germ",
 "💧": "droplet",
 "🔁": "repeat",
 "⏱": "timer",
 "🗑": "trash",
 "🥣": "utensils",
 "🐌": "snail",
 "🪐": "orbit",
 "💚": "heart-pulse",
 "🟠": "flask-conical",
 "›": "chevron-right"
};

export function ghIcon(name, size) {
  const body = PATHS[name];
  if (!body) return "";
  const st = size ? ` style="width:${size}px;height:${size}px"` : "";
  return `<svg class="gi gi-${name}"${st} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

const keys = Object.keys(EMOJI).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const SRC = `(${keys.join("|")})\\uFE0F?`;
const HAS = new RegExp(SRC);
const ALL = new RegExp(SRC, "g");
const escHtml = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

function convert(node) {
  const hits = [];
  if (node.nodeType === 3) { if (HAS.test(node.data)) hits.push(node); }
  else if (node.nodeType === 1) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const tag = n.parentNode && n.parentNode.nodeName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") continue;
      if (HAS.test(n.data)) hits.push(n);
    }
  }
  for (const t of hits) {
    if (!t.parentNode) continue;
    const html = escHtml(t.data).replace(ALL, (m, e) => ghIcon(EMOJI[e]) || m);
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    t.replaceWith(tpl.content);
  }
}

export function watchIcons(root) {
  convert(root);
  const obs = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "characterData") convert(m.target);
      else m.addedNodes.forEach((n) => { if (n.isConnected) convert(n); });
    }
    obs.takeRecords();
  });
  obs.observe(root, { childList: true, subtree: true, characterData: true });
  return () => obs.disconnect();
}