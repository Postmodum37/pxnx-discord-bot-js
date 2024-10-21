export class Config {
	public readonly clientId: string;
	public readonly guildId: string;
	public readonly token: string;

	constructor() {
		this.clientId = this.getRequiredEnvVar("CLIENT_ID");
		this.guildId = this.getRequiredEnvVar("GUILD_ID");
		this.token = this.getRequiredEnvVar("TOKEN");
	}

	private getRequiredEnvVar(name: string): string {
		const value = process.env[name];
		if (!value) {
			throw new Error(`Environment variable ${name} is missing`);
		}
		return value;
	}
}

// Create a singleton configuration object
export const config = new Config();
