import { Headers } from "node-fetch";
import { Agent } from "https";

export async function retrieveRequestFromStdin<T extends any>(): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        let inputRaw = "";
        process.stdin.on("data", (chunk) => inputRaw += chunk);
        process.stdin.on("end", async () => {
            try {
                const json = JSON.parse(inputRaw) as T;
                resolve(json);
            } catch (e) {
                reject(e);
            }
        });
    });
}

export function createFetchAgent<R extends CheckRequest>(request: R): Agent {
    let options = {
        ca: "",
        cert: "",
        key: "",
        keepAlive: false
    };
    
    if (request.source.tls_ca_cert != null && request.source.tls_client_cert != null && request.source.tls_client_key != null) {
        options.ca = request.source.tls_ca_cert;
        options.cert = request.source.tls_client_cert;
        options.key = request.source.tls_client_key;
    }

    const sslConfiguredAgent = new Agent(options);

    return sslConfiguredAgent;
}

export function createFetchHeaders<R extends CheckRequest>(request: R): Headers {
    const headers = new Headers();
    if (request.source.basic_auth_username && request.source.basic_auth_password) {
        const basicAuthUsername = request.source.basic_auth_username;
        const basicAuthPassword = request.source.basic_auth_password;
        headers.append("Authorization", `Basic ${new Buffer(basicAuthUsername + ":" + basicAuthPassword).toString("base64")}`);
    }
    return headers;
}

interface Request {
    source: {
        server_url: string
        chart_name: string
        version_range?: string
        basic_auth_username?: string
        basic_auth_password?: string
        harbor_api?: boolean
        tls_ca_cert?: string
        tls_client_cert?: string
        tls_client_key?: string
    }
}

export interface CheckRequest extends Request {
    version?: {
        version: string
        digest: string
    }
}

export type CheckResponse = {
    version: string
    digest: string
}[];

export interface InRequest extends CheckRequest {
    version: {
        version: string,
        digest: string
    },
    params: {
        target_basename?: string
    }
}

export interface InResponse {
    version: {
        version: string
        digest: string
    }
    metadata: {
        name: string
        value: string
    }[]
}

export interface OutRequest extends Request {
    params: {
        chart: string
        sign?: boolean
        key_data?: string
        key_file?: string
        key_passphrase?: string
        version?: string
        version_file?: string
        force?: boolean
        dependency_update?: boolean
    }
}

export interface OutResponse extends InResponse {
}
