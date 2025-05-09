# Contentstack MCP Server

A Model Context Protocol (MCP) server that connects with Contentstack's Content Management API and Content Delivery API, delivering extensive content administration, manipulation, and delivery functionality.

## Features

- **Content Management**: Full CRUD operations for entries and assets across multiple content types, with comprehensive operations for creating, retrieving, updating, and deleting content.
- **Content Delivery**: Access to published content through CDN-delivered assets and entries with support for environments, locales, and fallback options.
- **Taxonomy and Term Management**: Create and manage taxonomies and their associated terms, supporting hierarchical structures with ancestor and descendant relationships.
- **Localization**: Support for multiple locales with capabilities to localize and unlocalize entries, allowing content to be managed across different languages and regions.
- **Publishing Workflow**: Complete publishing pipeline with functionality to publish, unpublish, and schedule content releases across multiple environments.
- **Branch and Environment Management**: Robust tools for managing different branches, environments, and aliases, with features for merging and deploying content between branches.
- **Variant Management**: Support for content variants with dedicated tools for retrieving and managing different variants of entries.
- **Release Management**: Comprehensive release functionality allowing creation, cloning, deployment, and management of content releases.
- **Asset Management**: Complete asset lifecycle management with support for references, publishing, and unpublishing across environments.
- **Global Field Management**: Tools for retrieving and managing global fields that can be reused across content types.
- **Flexible Query Options**: Advanced query capabilities with support for pagination, filtering, sorting, and including associated data.

## Tools

### Entry Management

- **publish_an_entry**: This tool publishes a specified entry from a selected content type to one or more environments and locales within a designated branch of the stack.
- **unpublish_an_entry**: This tool unpublishes a specified entry from selected environments and locales within a Contentstack stack branch, removing the entry from the CDN and making it inaccessible via delivery APIs.
- **publish_variants_of_an_entry**: This tool publishes specified entry variants to selected environments and locales within a defined branch, supporting variant group targeting for content type entries.
- **create_an_entry**: This tool creates a new entry in the specified Contentstack stack, targeting a defined content type and branch, with support for locale selection and structured entry data.
- **delete_an_entry**: This tool deletes a specified entry from a Contentstack stack, targeting the provided content type and entry ID, with optional parameters for branch, locale, and deletion of all localized variants.
- **get_all_entries**: This tool retrieves entry details for a specified content type within a Contentstack stack, supporting branch selection, pagination, versioning, locale filtering, advanced query parameters, and optional inclusion of metadata, workflow, branch, and publish details.
- **get_single_entry**: This tool retrieves metadata and field values for a specified entry within a given content type, supporting branch, version, and locale selection, with optional inclusion of workflow, branch, and publish details.
- **update_an_entry**: This tool updates an existing entry in a specified Contentstack stack, branch, and locale by modifying its field data according to the provided content type and entry identifier.
- **localize_an_entry**: This tool localizes a specified entry within a stack by creating or updating its content for the target locale, ensuring the entry becomes independent from the fallback locale.
- **unlocalize_an_entry**: This tool unlocalizes a specified entry in a given locale, restoring the entry to its original non-localized state within the selected branch and content type.

### Content Type Management

- **get_all_content_types**: This tool retrieves the schema and metadata of a specified content type from a Contentstack stack, supporting branch selection, query filtering, pagination, and optional inclusion of global field schema and branch metadata.
- **get_a_single_content_type**: This tool retrieves the schema and configuration details of a specified content type within a stack, supporting optional inclusion of global field definitions and branch metadata for developer reference.
- **get_all_global_fields**: This tool retrieves metadata for all global fields configured within the specified stack, supporting optional branch selection and branch metadata inclusion.
- **get_a_single_global_field**: This tool retrieves metadata and configuration details for a specified global field within a Contentstack stack, supporting branch selection and optional inclusion of branch context.

### Content Delivery (CDN)

- **get_all_entries_cdn**: This tool retrieves CDN-delivered, published entries for the specified content type with optional environment, pagination, and localization support.
- **get_a_single_entry_cdn**: This tool returns CDN-delivered data for a published entry UID of a content type with options for environment and locale.
- **get_all_assets_cdn**: This tool returns CDN metadata for all publicly published assets in the specified environment (with optional branch/locale filtering), supporting version, publish-details, and metadata filters.
- **get_a_single_asset_cdn**: This tool retrieves CDN metadata for a published asset UID in the specified environment, enabling deterministic delivery.

### Variant Management

- **get_all_variants_of_an_entry**: This tool retrieves all locale variants of a specified entry within the selected content type, enabling access to localized entry data for further processing or analysis.
- **get_single_entry_variant**: This tool retrieves a specific variant of a content entry from a designated content type, branch, and locale, using the provided entry and variant identifiers.
- **get_all_variants_of_a_content_type**: This tool retrieves all variant definitions linked to the specified content type, enabling programmatic access to variant metadata for content modeling and management.
- **get_a_single_variant**: This tool retrieves detailed information for a specified variant within a designated Variant Group using the provided variant_id and variant_group_uid parameters.

### Taxonomy Management

- **get_all_taxonomies**: This tool retrieves metadata for all taxonomies within a specified stack, supporting pagination via limit and skip parameters, and enabling filtered search by UID or name.
- **get_a_single_taxonomy**: This tool retrieves metadata and configuration details for a specified taxonomy, with optional inclusion of term, referenced term, and referenced entry counts for advanced content modeling and reporting.
- **export_a_taxonomy**: This tool exports a taxonomy and all its associated terms from the specified stack in the selected format, supporting structured data extraction for taxonomy management.
- **create_a_taxonomy**: This tool creates a new taxonomy object within the specified stack, assigning the provided UID, name, and optional description for structured content classification.
- **update_a_taxonomy**: This tool updates the name and description fields of a specified taxonomy entity using its unique identifier.
- **delete_a_taxonomy**: This tool deletes the specified taxonomy and all associated terms from the stack.

### Term Management

- **get_all_terms**: This tool retrieves all term details for a specified taxonomy from the stack, supporting pagination via limit and skip parameters.
- **get_all_terms_across_all_taxonomies**: This tool retrieves term details from all taxonomies within the stack, supporting typeahead search, pagination via limit and skip, and optional total count inclusion.
- **get_all_ancestors_of_a_term**: This tool retrieves the complete ancestor hierarchy for a specified term within a taxonomy, supporting pagination via limit and skip parameters.
- **get_all_descendants_of_a_term**: This tool retrieves all descendant terms of a specified taxonomy term, supporting pagination via limit and skip parameters.
- **get_a_single_term**: This tool retrieves detailed metadata for a specified taxonomy term, supporting optional inclusion of child term and referenced entry counts.
- **create_a_term**: This tool creates a new term within a specified taxonomy by assigning a unique identifier, name, order, and optional parent term.
- **update_a_term**: This tool updates the name property of a specified term within a taxonomy using the provided taxonomy_uid and term_uid identifiers.
- **delete_a_term**: This tool deletes a specified term from a taxonomy using the provided taxonomy_uid and term_uid parameters; supports forced deletion via the force flag.

### Asset Management

- **get_all_assets**: This tool retrieves metadata for all assets within a specified stack, supporting environment and branch filters, with pagination via limit and skip parameters.
- **get_a_single_asset**: This tool retrieves metadata and properties for a specified asset within a Contentstack stack, supporting branch, environment, and version parameters for precise asset identification and retrieval.
- **get_asset_reference**: This tool retrieves all entries referencing the specified asset within the selected branch, enabling asset dependency analysis and content relationship management.
- **delete_an_asset**: This tool permanently deletes the specified asset from the selected branch within the stack.
- **publish_an_asset**: This tool publishes a specified asset from a selected branch to one or more environments and locales within a stack, with optional scheduling for future deployment.
- **unpublish_an_asset**: This tool unpublishes a specified asset from selected environments and locales within a given branch, with optional scheduling for deferred execution.

### Language Management

- **get_all_languages**: This tool retrieves metadata for all languages configured within a specified stack branch, supporting pagination via limit and skip parameters.

### Environment Management

- **get_all_environments**: This tool fetches the list of environments in a stack with optional total-count reporting and ascending/descending sorting by any environment field.
- **create_an_environment**: This tool creates a new environment in the stack by specifying its name and one or more locale-specific base URLs.
- **get_an_environment**: This tool retrieves full details for a single environment, identified by its name.
- **update_an_environment**: This tool updates an existing environment, identified by its name in the URL path. You can change the environment's name and/or its locale-to-URL mappings.
- **delete_an_environment**: This tool permanently deletes an environment, identified by its name.

### Branch Management

- **get_all_branches**: This tool retrieves metadata for all branches within a specified stack, supporting pagination via limit and skip parameters.
- **get_a_single_branch**: This tool retrieves metadata and configuration details for a specified branch within a Contentstack stack, enabling branch-level inspection and management.
- **merge_branch**: This tool merges content types and global fields from a compare branch into a base branch, with optional per item strategy overrides.
- **get_all_branch_aliases**: This tool retrieves metadata for all branch aliases within a specified stack, supporting pagination via limit and skip parameters.
- **get_a_single_branch_alias**: This tool retrieves metadata and configuration details for a specified branch alias within a Contentstack stack, enabling branch management and validation operations.
- **get_a_single_merge_job**: This tool retrieves detailed information for a specified merge job within a stack, using the provided merge_job_uid parameter.

### Release Management

- **get_all_releases**: This tool retrieves metadata for all releases within a specified stack, supporting branch selection, pagination via limit and skip parameters, and optional inclusion of total and item counts.
- **get_a_single_release**: This tool retrieves metadata and configuration details for a specified release within a given branch, supporting optional inclusion of branch information for developer reference and audit purposes.
- **get_all_items_in_a_release**: This tool retrieves metadata and content details for all items associated with the specified release_id, optionally including branch information if include_branch is true.
- **create_a_release**: This tool creates a new empty release object within the specified stack branch, initializing it with a required name and optional description; supports branch selection and inclusion parameters for release management.
- **clone_a_release**: This tool creates a duplicate of an existing release in the specified branch, assigning a new name and optional description to the cloned release.
- **add_items_to_a_release**: This tool programmatically adds specified content items to a designated release within a Contentstack stack branch by accepting structured item data in JSON format, enabling automated release management and deployment workflows.
- **delete_items_from_a_release**: This tool programmatically removes specified content items from a designated release within a Contentstack stack branch, requiring the release identifier and item data in JSON format for precise targeting and execution.
- **deploy_a_release**: This tool deploys a specified release to one or more target environments within a Contentstack stack, supporting branch selection and optional scheduling for automated release publishing.

### Publishing Management

- **get_publish_queue**: This tool retrieves metadata and content for all entries, both published and unpublished, within a specified stack branch, supporting query filtering, pagination, and branch selection.

## Configuration

### Prerequisites

1. Create a Contentstack account at [Contentstack](https://www.contentstack.com/login/)
2. Generate a [Management token](https://www.contentstack.com/docs/developers/create-tokens/generate-a-management-token/) from your Stack Settings
3. For Content Delivery API access, generate a [Delivery token](https://www.contentstack.com/docs/developers/create-tokens/create-a-delivery-token/) for the appropriate environment

### Environment Variables

These variables can also be set as arguments

- `CONTENTSTACK_REGION` / `--region`: Contentstack Regions (defaults to NA)
  - Possible values: `NA` (for AWS NA), `EU` (for AWS EU), `AZURE_NA`, `AZURE_EU`, `GCP_NA`, `GCP_EU`
- `CONTENTSTACK_API_KEY` / `--stack-api-key`: Your Stack API Key
- `CONTENTSTACK_MANAGEMENT_TOKEN` / `--management-token`: Your Stack Management token
- `CONTENTSTACK_DELIVERY_TOKEN` / `--delivery-token`: Your Stack Delivery token (required only if using CDN/Delivery API tools)

### Usage with Claude Desktop

You can use this MCP without cloning the repository by simply modifying your Claude Desktop configuration file. Just edit `~/Library/Application Support/Claude/claude_desktop_config.json` to include the necessary configuration.

```json
{
  "mcpServers": {
    "contentstack": {
      "command": "npx",
      "args": ["-y", "@contentstack/mcp"],
      "env": {
        "CONTENTSTACK_API_KEY": "<YOUR_STACK_API_KEY>",
        "CONTENTSTACK_MANAGEMENT_TOKEN": "<YOUR_STACK_MANAGEMENT_TOKEN>",
        "CONTENTSTACK_REGION": "<YOUR_STACK_REGION>",
        "CONTENTSTACK_DELIVERY_TOKEN": "<YOUR_DELIVERY_TOKEN>"
      }
    }
  }
}
```

Note: The `CONTENTSTACK_DELIVERY_TOKEN` is optional and only required if you plan to use the Content Delivery API (CDN) tools.

If your MCPClient doesn't support environment variables, you can alternatively provide the required authentication parameters as command-line arguments:

```json
{
  "mcpServers": {
    "contentstack": {
      "command": "npx",
      "args": [
        "-y",
        "@contentstack/mcp",
        "--management-token",
        "<YOUR_STACK_MANAGEMENT_TOKEN>",
        "--stack-api-key",
        "<YOUR_STACK_API_KEY>",
        "--region",
        "<YOUR_STACK_REGION>",
        "--delivery-token",
        "<YOUR_DELIVERY_TOKEN>"
      ]
    }
  }
}
```

### Developing and using Claude desktop

If you want to contribute and test what Claude does with your contributions;

- run `npm run dev`, this will start the watcher that rebuilds the MCP server on every change
- update `claude_desktop_config.json` to reference the project directly, ie;

```json
{
  "mcpServers": {
    "contentstack": {
      "command": "node",
      "args": ["/path/to/mcp/bin/contentstack-mcp.js"],
      "env": {
        "CONTENTSTACK_API_KEY": "<YOUR_STACK_API_KEY>",
        "CONTENTSTACK_MANAGEMENT_TOKEN": "<YOUR_STACK_MANAGEMENT_TOKEN>",
        "CONTENTSTACK_REGION": "<YOUR_STACK_REGION>",
        "CONTENTSTACK_DELIVERY_TOKEN": "<YOUR_DELIVERY_TOKEN>"
      }
    }
  }
}
```

This setup enables direct testing of MCP server modifications with Claude, though adding new tools or resources will necessitate restarting Claude Desktop.

## The MIT License (MIT)

Copyright © 2025 [Contentstack](https://www.contentstack.com/). All Rights Reserved

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
