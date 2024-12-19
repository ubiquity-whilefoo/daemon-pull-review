# `@ubiquity-os/daemon-pull-review`

This is a high context aware GitHub organization integrated bot that uses the Anthopic Claude 3.5 Sonnet model to provide automated reviews and feeback to Github pull requests.

## Usage

Just convert a pull request to be ready for review and the bot automatically reviews and requests changes if necessary

## How it works

With its huge context window, we are able to feed the entire issue specification and the pull request to the model which we obtain. This allows the model to have a very deep understanding of the current scope and provide highly relevant reviews.

## Installation

`ubiquibot-config.yml`:

```yml
plugins:
  - uses:
      - plugin: http://localhost:4000
        with:
          anthropicAiModel: "" # Optional - defaults to latest Claude model
          anthropicAiBaseUrl: "" # Optional - defaults to Anthropic's API endpoint
```

`.dev.vars` (for local testing):

specify the AnthropicAiBase URL in the `ubiquibot-config.yml` file and set the `ANTHROPIC_API_KEY` in the `.dev.vars` file.

```sh
ANTHROPIC_API_KEY=your_anthropic_api_key
UBIQUITY_OS_APP_NAME="UbiquityOS"
```

## Testing

```sh
yarn test
```
