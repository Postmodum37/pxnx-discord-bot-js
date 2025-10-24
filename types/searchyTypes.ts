/**
 * Type definitions for Searchy API responses
 * These match the Python Pydantic models in searchy/app/models.py
 */

export interface AudioFormatInfo {
	format_id: string;
	url: string;
	ext: string;
	acodec: string | null;
	abr: number | null;
	filesize: number | null;
	quality: string | null;
}

export interface AudioStreamResponse {
	video_id: string;
	title: string;
	url: string;
	duration: number | null;
	channel: string | null;
	thumbnail: string | null;
	audio_format: AudioFormatInfo;
	url_expires_in: number | null;
	timestamp: string;
}

export interface SearchResult {
	video_id: string;
	title: string;
	url: string;
	duration: number | null;
	view_count: number | null;
	like_count: number | null;
	channel: string | null;
	channel_id: string | null;
	upload_date: string | null;
	description: string | null;
	thumbnail: string | null;
	categories: string[] | null;
	tags: string[] | null;
}

export interface VideoSearchResponse {
	query: string;
	results: SearchResult[];
	count: number;
	timestamp: string;
}

export interface ErrorResponse {
	error: string;
	detail: string | null;
	timestamp: string;
}
