export default defineContentScript({
  matches: ["*://*.meesho.com/*"],

  main() {
    console.log("PROJECT NEO CONTENT READY");

    browser.runtime.onMessage.addListener(
      (message, _sender, sendResponse) => {
        console.log(
          "[PROJECT NEO CONTENT] Message received:",
          message?.type
        );

        const requestId = crypto.randomUUID();

        if (
          message?.type ===
          "PROJECT_NEO_GENERATE_MEESHO_BULK"
        ) {
          const handler = (event: MessageEvent) => {
            if (
              event.source !== window ||
              event.data?.source !==
                "PROJECT_NEO_MEESHO_MAIN" ||
              event.data?.type !==
                "PROJECT_NEO_BULK_RESULT" ||
              event.data?.requestId !== requestId
            ) {
              return;
            }

            console.log(
              "[PROJECT NEO CONTENT] MAIN bulk result received:",
              requestId
            );

            window.removeEventListener(
              "message",
              handler
            );

            sendResponse(event.data.result);
          };

          window.addEventListener(
            "message",
            handler
          );

          window.postMessage(
            {
              source:
                "PROJECT_NEO_EXTENSION",

              type:
                "PROJECT_NEO_GENERATE_MEESHO_BULK",

              requestId,

              templateBase64:
                message.templateBase64,

              templateName:
                message.templateName,

              templateType:
                message.templateType,

              products:
                message.products,
            },
            "*"
          );

          return true;
        }

        if (
          message?.type ===
          "PROJECT_NEO_AUTOFILL_MEESHO"
        ) {
          const handler = (event: MessageEvent) => {
            if (
              event.source !== window ||
              event.data?.source !==
                "PROJECT_NEO_MEESHO_MAIN" ||
              event.data?.type !==
                "PROJECT_NEO_AUTOFILL_RESULT" ||
              event.data?.requestId !== requestId
            ) {
              return;
            }

            console.log(
              "[PROJECT NEO CONTENT] MAIN autofill result received:",
              requestId
            );

            window.removeEventListener(
              "message",
              handler
            );

            sendResponse(event.data.result);
          };

          window.addEventListener(
            "message",
            handler
          );

          window.postMessage(
            {
              source:
                "PROJECT_NEO_EXTENSION",

              type:
                "PROJECT_NEO_AUTOFILL_MEESHO",

              requestId,

              product:
                message.product,
            },
            "*"
          );

          return true;
        }
      }
    );

    console.log(
      "PROJECT NEO CONTENT MESSAGE LISTENER READY"
    );

    void injectScript(
      "/meesho-main-world.js",
      {
        keepInDom: true,
      }
    ).then(() => {
      console.log(
        "PROJECT NEO MAIN WORLD INJECTED"
      );
    });
  },
});