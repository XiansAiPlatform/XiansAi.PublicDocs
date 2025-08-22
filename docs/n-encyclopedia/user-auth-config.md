# Tenant OIDC Authentication Configuration

Configure OpenID Connect (OIDC) authentication per tenant. These settings are encrypted at rest and enforced at runtime for both REST and WebSocket endpoints.

## Authentication Priority

**Important:** When both an API key and JWT token are provided in a request, the system gives **priority to the API key**. The JWT token will be ignored in favor of API key authentication.

This means:

- If you provide both `apikey` parameter and `Authorization: Bearer <jwt-token>` header, the API key takes precedence
- JWT token validation (configured below) only applies when no API key is present
- For API key generation and management, see Portal → Settings → API Keys

## JWT Token Participant Validation

**Important:** When using JWT token authentication, the system validates that the `participantId` sent in the request matches the user identity extracted from the token using `userIdClaim(s)`.

### How it works

1. **User Identity Extraction**: The system extracts the user identity from the JWT token using the configured `userIdClaim` or `userIdClaims` settings
   - If `userIdClaim` is specified: uses that single claim (e.g., `"sub"`)
   - If `userIdClaims` is specified: tries claims in order until one is found (e.g., `"sub,email"` tries `sub` first, then `email`)
   - If neither is configured: defaults to standard claims like `sub` or `oid`

2. **Participant Validation**: The extracted user identity must exactly match the `participantId` parameter sent in the request

3. **Authentication Failure**: If the `participantId` doesn't match the token's user identity, authentication will fail

### Example

If your JWT token contains `"sub": "user123@company.com"` and you configure:

```json
"providerSpecificSettings": {
  "userIdClaim": "sub"
}
```

Then your API requests must use `participantId=user123@company.com`, otherwise authentication will fail.

**Note:** This validation only applies when JWT tokens are used for authentication (not when API keys are used).

## Where to configure

- Portal → Settings → Auth config (per tenant)
- Providers per tenant: minimum 1, maximum 5
- Config is stored encrypted

### Prerequisites

In your Xians AI server environment (if not already set), configure the encryption keys before saving any auth config in the portal:

```json
{
  "EncryptionKeys": {
    "BaseSecret": "<LONG_RANDOM_BASE_SECRET>",
    "UniqueSecrets": {
      "TenantOidcSecretKey": "<LONG_RANDOM_UNIQUE_SECRET_FOR_TENANT_OIDC>"
    }
  }
}
```

## Quick start (Xians ai Portal)

1. Open your tenant → Settings → Auth config
2. Click on Create configuration
3. Edit the JSON template that appear and adjust the values for your identity providers
4. Start with one provider, verify login, then add others if needed
5. Keep `allowedProviders` minimal to explicitly whitelist providers
6. `issue` is mandatory for each provider and you can put `null` for other attributes if not needed.

## Recommended JSON template (secure defaults)

Use this as a starting point. Replace placeholders with your values. Provider keys (`Auth0`, `Keycloak`, etc.) are identifiers you choose. If you set `allowedProviders`, only those keys can be used.

Example:

```json
{
  "tenantId": "99x.io",
  "allowedProviders": [
    "Auth0",
    "Keycloak",
    "AzureB2C",
    "Google"
  ],
  "providers": {
    "Auth0": {
      "authority": "https://your-tenant.auth0.com/",
      "issuer": "https://your-tenant.auth0.com/",
      "expectedAudience": [
        "https://api.yourapp.com"
      ],
      "scope": "openid profile email",
      "requireSignedTokens": true,
      "acceptedAlgorithms": ["RS256"],
      "requireHttpsMetadata": true,
      "additionalClaims": [
        { "claim": "email_verified", "op": "equals", "value": true },
        { "claim": "aud", "op": "equals", "value": "https://api.yourapp.com" }
      ],
      "providerSpecificSettings": {
        "userIdClaim": "sub"
      }
    },
    "Keycloak": {
      "authority": null,
      "issuer": "http://localhost:18080/realms/xiansai",
      "expectedAudience": ["xiansai-api"],
      "scope": "openid profile email",
      "requireSignedTokens": true,
      "acceptedAlgorithms": ["RS256"],
      "requireHttpsMetadata": false,
      "additionalClaims": [
        { "claim": "azp", "op": "equals", "value": "xiansai-client" },
        { "claim": "groups", "op": "contains", "value": "xians-admins" }
      ],
      "providerSpecificSettings": {
        "userIdClaims": "sub,email"
      }
    },
    "AzureB2C": {
      "authority": "https://login.microsoftonline.com/your-tenant-id/v2.0",
      "issuer": "https://sts.windows.net/your-tenant-id/",
      "expectedAudience": [
        "api://774af795-bae0-42cb-b10f-1bff6e15c3c4"
      ],
      "scope": "openid profile email",
      "requireSignedTokens": true,
      "acceptedAlgorithms": ["RS256"],
      "requireHttpsMetadata": true,
      "additionalClaims": [
        { "claim": "tid", "op": "equals", "value": "your-tenant-id" },
        { "claim": "scp", "op": "contains", "value": "access_as_user" }
      ],
      "providerSpecificSettings": {
        "userIdClaims": "oid,sub"
      }
    },
    "Google": {
      "authority": "https://accounts.google.com",
      "issuer": "https://accounts.google.com",
      "expectedAudience": [
        "your-google-client-id.apps.googleusercontent.com"
      ],
      "scope": "openid email profile",
      "requireSignedTokens": true,
      "acceptedAlgorithms": ["RS256"],
      "requireHttpsMetadata": true,
      "additionalClaims": [
        { "claim": "email_verified", "op": "equals", "value": true },
        { "claim": "hd", "op": "equals", "value": "yourcompany.com" }
      ],
      "providerSpecificSettings": {
        "userIdClaims": "sub,email"
      }
    }
  },
  "notes": "Configure 1–5 OIDC providers per tenant. Strongly prefer RS256, strict issuer, and audience checks."
}
```

## Field reference

- **tenantId**: Must exactly match the tenant id for which you’re configuring auth
- **allowedProviders**: Optional list of provider keys allowed for this tenant. If set, only these keys may be used
- **providers**: A map of provider key → rule object
  - **authority**: Base URL used for OIDC discovery. If omitted, `issuer` (or token `iss`) is used
  - **issuer**: Exact issuer that tokens must match. Required by service constraints
  - **expectedAudience**: List of allowed audiences. If provided, audience validation is enforced
  - **scope**: Space-separated scopes required to be present (checked against `scope` or `scp`)
  - **requireSignedTokens**: Defaults to true. Determines if signature validation is required
  - **acceptedAlgorithms**: Restrict signing algorithms (e.g., `["RS256"]`)
  - **requireHttpsMetadata**: Defaults to true. Only set to false for local/dev identity servers
  - **additionalClaims**: Extra per-claim checks. See syntax below
  - **providerSpecificSettings**:
    - `userIdClaim`: Single claim to use for the canonical user id when `sub`/`oid` are not present
    - `userIdClaims`: Comma-separated preference list (e.g., `"sub,email"`)

### additionalClaims syntax

Each entry enforces an operation against a single claim value.

```json
{ "claim": "<claim-name>", "op": "equals|not_equals|contains", "value": <string|number|boolean|array> }
```

Notes:

- `value` may be a string/number/boolean or an array of those. Arrays are evaluated as:

  - `equals`: token value must equal any of the provided values
  - `not_equals`: token value must equal none of the provided values
  - `contains`: token value string must contain any of the provided values

- Comparisons are ordinal (case-sensitive). Provide exact expected casing

## Security recommendations

- Keep `requireHttpsMetadata: true` (except local development)
- Always set `issuer` to the exact expected value (copy from discovery document)
- Set `acceptedAlgorithms` to `["RS256"]` (or your provider’s strongest asymmetric alg)
- Provide `expectedAudience` (and require proper `aud`)
- Use `scope` to require precise scopes minimally needed
- Add `additionalClaims` for tenant/org enforcement. Examples:

  - Azure AD/B2C: `{ "claim": "tid", "op": "equals", "value": "<tenant-guid>" }`
  - Google Workspace: `{ "claim": "hd", "op": "equals", "value": "yourcompany.com" }`
  - Auth0 organization: `{ "claim": "org_id", "op": "equals", "value": "<org-id>" }`
  - Keycloak groups: `{ "claim": "groups", "op": "contains", "value": "<required-group>" }`

## Constraints and validation

- Providers: minimum 1, maximum 5
- Each configured provider must include a non-empty `issuer`
- `tenantId` in JSON must match the tenant path/selection in the UI
- If `allowedProviders` is set, only those keys can be selected/used for this tenant

## Troubleshooting

- "The encryption keys may have changed. Please reconfigure…": Your app’s encryption keys changed; re-save the config in UI
- "Provider not allowed for tenant": The provider key is not listed in `allowedProviders`
- "No OIDC providers configured for tenant": Add at least one entry under `providers`
- "Signing algorithm not allowed": Ensure the token’s `alg` is present in `acceptedAlgorithms` or remove the restriction
- "Required scope missing": Ensure the token has the scopes listed in `scope`

## Minimal example

```json
{
  "tenantId": "acme.io",
  "providers": {
    "Auth0": {
      "issuer": "https://acme.auth0.com/",
      "expectedAudience": ["https://api.acme.io"],
      "requireSignedTokens": true,
      "acceptedAlgorithms": ["RS256"],
      "requireHttpsMetadata": true,
      "additionalClaims": [
        { "claim": "email_verified", "op": "equals", "value": true }
      ]
    }
  }
}
```

## Authorization model and risks

**Important:** The system performs stateless, per-request validation of JWTs. It does not persist end users in a database or maintain server-side user sessions, and there is no centralized, strict role-based authorization for end users in the User API beyond what their token and your tenant rules enforce. Therefore:

- If you do not configure restrictive rules for your tenant, anyone with a valid token from a listed provider that matches minimal checks could gain access to eligible endpoints
- You must explicitly constrain access with strong, tenant-specific rules in this config

Recommended hardening steps:

- Pin issuer and require HTTPS metadata (prod): set `issuer` precisely and keep `requireHttpsMetadata: true`
- Restrict signing algorithms: set `acceptedAlgorithms` to `["RS256"]` and keep `requireSignedTokens: true`
- Enforce audience and scope: set `expectedAudience` and `scope` and ensure client apps request only the minimal necessary scopes
- Lock to your organization/tenant (examples):

  - Azure AD/B2C: `tid` equals your tenant GUID
  - Auth0: `org_id` equals your organization id (if used)
  - Google Workspace: `hd` equals your domain (e.g., `yourcompany.com`)
  - Keycloak: `groups` contains a required group (e.g., `xians-admins`)
- Constrain clients: require `azp` (authorized party) equals your expected client id
- Prefer canonical user ids from stable claims (`sub`, `oid`) and, if needed, set `providerSpecificSettings.userIdClaim(s)`
- Keep `allowedProviders` minimal; avoid listing providers you do not actively use
