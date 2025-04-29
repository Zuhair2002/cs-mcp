export async function publish_run(event:any) {
    const fetch = require("node-fetch");
    const { API_URL } = event?.apiConfig;
    const {
      content_type_uid,
      entry,
      publish_with_reference,
      scheduled_at,
    } = event.input;
    let response;
    let { environments, locales } = event.input;
    environments = environments && [...new Set(environments.flat(Infinity))];
    locales = locales && [...new Set(locales.flat(Infinity))];
    let locale = locales?.length ? locales[0] : undefined;

    if(locales && locales.length > 1) {
      try {
        const entryResponse = await fetch(
          `${API_URL}/v3/content_types/${content_type_uid}/entries/${entry}`,
          {
            method: "GET",
            headers: this.getHeaders(event),
          }
        );
        const entryResponseBody = await entryResponse.json();
        locale = entryResponseBody.entry.locale;
      } catch (error) {
        throw new Error("Error fetching entry locale");
      }
    }

    if (!publish_with_reference) {
      const body = {
        entry: {
          environments: environments,
          locales: locales ? locales : undefined,
        },
        locale: locale ? locale : undefined,
        scheduled_at: scheduled_at
          ? new Date(scheduled_at).toISOString()
          : undefined,
      };
      response = await fetch(
        `${API_URL}/v3/content_types/${content_type_uid}/entries/${entry}/publish`,
        {
          method: "POST",
          headers: this.getHeaders(event),
          body: JSON.stringify(body),
        }
      );
    } else {
      const qs = new URLSearchParams();
      qs.append("publish_with_reference", publish_with_reference);
      qs.append("x-bulk-action", "publish");

      const body = {
        locales: locales ? locales : undefined,
        environments: environments,
        scheduled_at: scheduled_at
          ? new Date(scheduled_at).toISOString()
          : undefined,
      };

      if(locales && locales.length) {
        body['entries'] =  locales.map(arrlocale => {
          return {
            uid: entry,
            content_type: content_type_uid,
            locale: arrlocale
          }
        })

        if(!locales.includes(locale)){
          body.entries.push({
            uid: entry,
            content_type: content_type_uid,
            locale: locale
          })
        }
      }

      response = await fetch(`${API_URL}/v3/bulk/publish?${qs.toString()}`, {
        body: JSON.stringify(body),
        method: "POST",
        headers: this.getHeaders(event),
      });
    }

    if (response.ok) {
      const responseBody = await response.json();
      return responseBody;
    } else {
      throw await response.text();
    }
}
  
export async function get_single_content_type_run(event:any) {
    const fetch = require("node-fetch");
    const { API_URL } = event?.apiConfig;
    const { content_type_name } = event.input;
    const { include_branch, include_global_field_schema } = event.input;

    const qs = new URLSearchParams();
    !!include_branch && qs.append("include_branch", include_branch);
    !!include_global_field_schema &&
      qs.append("include_global_field_schema", include_global_field_schema);

    const apiUrl = `${API_URL}/v3/content_types/${content_type_name}?${qs.toString()}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: event.headers,
    });

    if (response.status === 200) {
      const body = await response.json();
      return body;
    }
    throw await response.text();
  }