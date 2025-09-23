export class Config {
	public readonly clientId: string;
	public readonly guildId: string;
	public readonly token: string;
	public readonly openWeatherApiKey: string;

	constructor() {
		this.clientId = this.getRequiredEnvVar("CLIENT_ID");
		this.guildId = this.getRequiredEnvVar("GUILD_ID");
		this.token = this.getRequiredEnvVar("TOKEN");
		this.openWeatherApiKey = this.getRequiredEnvVar("OPENWEATHERMAP_API_KEY");
	}

	private getRequiredEnvVar(name: string): string {
		const value = process.env[name];
		if (!value || value.trim() === "") {
			throw new Error(`Environment variable ${name} is missing or empty`);
		}
		return value.trim();
	}

	public getOptionalEnvVar(name: string, defaultValue = ""): string {
		const value = process.env[name];
		return value?.trim() ?? defaultValue;
	}
}

// Create a singleton configuration object
export const config = new Config();
