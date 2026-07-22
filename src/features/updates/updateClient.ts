const repository = "meshahid973/typely";
const releasesUrl = `https://github.com/${repository}/releases`;
const latestReleaseEndpoint = `https://api.github.com/repos/${repository}/releases/latest`;

interface GitHubReleaseAsset {
  name?: unknown;
  browser_download_url?: unknown;
}

interface GitHubReleaseResponse {
  tag_name?: unknown;
  name?: unknown;
  html_url?: unknown;
  body?: unknown;
  assets?: unknown;
}

export interface TypelyRelease {
  version: string;
  title: string;
  pageUrl: string;
  downloadUrl: string;
  notes: string;
  test: boolean;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function findWindowsInstaller(assets: unknown) {
  if (!Array.isArray(assets)) {
    return "";
  }

  const installer = assets.find((asset): asset is GitHubReleaseAsset => {
    if (!asset || typeof asset !== "object") {
      return false;
    }

    const name = readString((asset as GitHubReleaseAsset).name).toLowerCase();
    return name.endsWith(".exe") && (name.includes("setup") || name.includes("installer"));
  });

  return readString(installer?.browser_download_url);
}

export async function fetchLatestRelease(signal?: AbortSignal): Promise<TypelyRelease | null> {
  const response = await fetch(latestReleaseEndpoint, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub release check failed with ${response.status}.`);
  }

  const release = (await response.json()) as GitHubReleaseResponse;
  const version = readString(release.tag_name);
  const pageUrl = readString(release.html_url);

  if (!version || !pageUrl.startsWith(`${releasesUrl}/`)) {
    return null;
  }

  return {
    version,
    title: readString(release.name) || `Typely ${version}`,
    pageUrl,
    downloadUrl: findWindowsInstaller(release.assets) || pageUrl,
    notes: readString(release.body),
    test: false,
  };
}

export function createTestRelease(): TypelyRelease {
  return {
    version: "v99.0.0-test",
    title: "Update banner test",
    pageUrl: releasesUrl,
    downloadUrl: releasesUrl,
    notes: "The GitHub update banner, animation and release button are working.",
    test: true,
  };
}
