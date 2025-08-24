"use strict";
/**
 * Type definitions for Conway's Game of Life Studio
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaybackState = exports.CellShape = void 0;
// Enums
var CellShape;
(function (CellShape) {
    CellShape["Square"] = "square";
    CellShape["Circle"] = "circle";
})(CellShape || (exports.CellShape = CellShape = {}));
var PlaybackState;
(function (PlaybackState) {
    PlaybackState["Stopped"] = "stopped";
    PlaybackState["Playing"] = "playing";
    PlaybackState["Paused"] = "paused";
    PlaybackState["Recording"] = "recording";
})(PlaybackState || (exports.PlaybackState = PlaybackState = {}));
