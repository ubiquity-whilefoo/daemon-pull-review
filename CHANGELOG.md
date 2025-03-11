# Changelog

## [1.1.0](https://github.com/ubiquity-whilefoo/daemon-pull-review/compare/v1.0.0...v1.1.0) (2025-03-11)


### Features

* add more tests ([026498d](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/026498de5e080f07d5ea13cbad5b9262a360df71))
* add reaction logic ([d74c489](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/d74c489e1b2071b2012ffb1d0acc606bf97873ad))
* add reviewInterval option to plugin settings with default value ([1b82160](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/1b8216028794a5dddefb6a88c902e51967e027ef))
* add test ([cc2b4d4](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/cc2b4d4905ba5dd06fc37d8e46a950c62ebc0853))
* add tests ([b159a55](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/b159a5559e4734fdf3eef2be5446449c02e38ca2))
* add tests ([1a668df](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/1a668df2216dea4342e934b6d2a277f1815e79c2))
* add tokenLimt to config and skip core team for reviewing ([5963e81](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/5963e8161c84f5afc762687e7e56a07d78c0e9b2))
* configurable reviewInterval ([7651542](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/7651542405989acae9ec1c81214f96670f88435d))
* enable formatting check to run on pr ([ade842e](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/ade842efbb082ceabf30330f29e933c6abf6c75e))
* exclude generated files ([6d78d66](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/6d78d6624021b921c2928ea532dc9dbd0d58f9ae))
* handle new linked issue & skip precheck on no linked issue ([7cac935](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/7cac9353f999e7eeac609e4ef5a3fd3d59b534db))
* init ([73b4865](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/73b48651e42627bd81debf59aa6e1df6838d7b65))
* restrict review to only be accesible to author ([641ff48](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/641ff488d67abef6d53510493385d3755fb3b48c))
* run precheck on reopen and bump sdk and logger versions ([f452784](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/f4527845497c825c23262eedf210c587d924e77d))
* support for multiple linked issues ([a619d85](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/a619d8510fbaac774942412e19b926d9faa4fdc2))
* time strings for reviewInterval ([2ad4851](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/2ad4851823bcd3eb77658fda2fcfc3f328e33730))
* use graphql to get issues and remove comment being parsed in regex ([4781ebe](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/4781ebe16a62f0f2777060100b6021e9aded3d68))
* used ubiquity's knip-reporter ([88c07dc](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/88c07dc78e643b4eded07e8718ad7ca38657e7df))
* used ubiquity's knip-reporter ([dd8338c](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/dd8338c917213349ec1ebb147f1f57635e70099a))


### Bug Fixes

* a lot ([222233d](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/222233dd84eef27531df7c53f626647099501e93))
* add listener and skip precheck on no linked issue ([3540c4e](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/3540c4e64147c40ed93a2aa576592d6161362474))
* add token usage of sysMsg query and localContext without file diff to limit file diff inclusion ([aca2d6c](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/aca2d6c19f820a0f22a4a79a92e2f99385ad9029))
* add workflow support ([feefb56](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/feefb564d3b0e25892da6d6fe8daf3ac6f4109e0))
* comment -&gt; approve ([d6420b9](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/d6420b9a5eeddf1ddb9790e9620917d2631d4c38))
* fix default config and remove verbose check comment ([3c1fd56](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/3c1fd56e6b7bbe425f255b134c1a56292fa039e0))
* fix the parser and make it more flexible ([22c4e66](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/22c4e6662bc845620b1c32b7261168ee23c7ae0f))
* fixed prettier error ([e9179f8](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/e9179f8d39578e0646362807b6b3bd85bdfa2734))
* make regex api compliant and refactor code ([5888974](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/5888974487ab6842ce798c63873d563b6b95b5a4))
* pesky prNumber -&gt; pr_number and refactor yarn-&gt;bun ([71146e7](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/71146e75bd4b340850d41c3fc997b6a198ba390d))
* populate ignored files from correct sources ([23a636c](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/23a636cac506a50b855c09ec2635e872d265d194))
* prettier ([7146433](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/7146433d9b9057292e24430dc05d1a943d383581))
* refactor ([ef082dc](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/ef082dcf01994100606107e0dc8f681e053a5d85))
* refactor file parsing, output parsing and exclude generated files ([0de8a64](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/0de8a648be912d734a4cf53207ef2ebd78932c83))
* remove empty strings and fix file exlcusion ([4a875b9](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/4a875b9611db07d79137ec7c582a54021a6c73a4))
* remove respone format and fix test ([5655a16](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/5655a168a1d5e59817cb2d555efcbf3bd9462ca6))
* some fixes and removes unecessary config prop ([01d03be](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/01d03beda469393bf74b1edb9b70f89a8ce5a2e1))
* subtract tokens from tokens remianing ([0b566eb](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/0b566eb89f2f93186d60d2463dcae57b919fef6d))
* tests ([3b9de0a](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/3b9de0a4e2b9939994171bed11824fa0cc1a95d6))
* update reviewInterval validation and add tests for pluginSettingsSchema defaults ([58d7852](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/58d785226563f5f03ef45d43ab38550f2dabe5b9))
* use absolute issue urls instead of keywords ([4555850](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/45558505d70a70dc8d3f9f0306f5eeda5583253d))
* use correct issue's owner and repo and not payloads owner and repo ([fa398d4](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/fa398d41be58883ab795b0f3825e3ce6fabe909e))
* use correct issue's owner and repo and not payloads owner and repo ([2567c74](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/2567c74bf5aa6b51f5cafde3fab617d06dfe4a05))
* use correct type ([9fe162a](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/9fe162a78e1d174f15d9cdc7686b7a7b6461864a))
* use correct type ([0d6b241](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/0d6b2415b9968b9858bf5ad7642a7f296a261938))
* use open router and remove recalc of token ([764eba2](https://github.com/ubiquity-whilefoo/daemon-pull-review/commit/764eba2bdf7d4efff978fd2e5169f3d3650ad149))

## 1.0.0 (2025-01-27)

### Features

- add more tests ([026498d](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/026498de5e080f07d5ea13cbad5b9262a360df71))
- add reaction logic ([d74c489](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/d74c489e1b2071b2012ffb1d0acc606bf97873ad))
- add tests ([1a668df](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/1a668df2216dea4342e934b6d2a277f1815e79c2))
- add tokenLimt to config and skip core team for reviewing ([5963e81](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/5963e8161c84f5afc762687e7e56a07d78c0e9b2))
- exclude generated files ([6d78d66](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/6d78d6624021b921c2928ea532dc9dbd0d58f9ae))
- init ([73b4865](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/73b48651e42627bd81debf59aa6e1df6838d7b65))
- restrict review to only be accesible to author ([641ff48](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/641ff488d67abef6d53510493385d3755fb3b48c))

### Bug Fixes

- a lot ([222233d](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/222233dd84eef27531df7c53f626647099501e93))
- add token usage of sysMsg query and localContext without file diff to limit file diff inclusion ([aca2d6c](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/aca2d6c19f820a0f22a4a79a92e2f99385ad9029))
- add workflow support ([feefb56](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/feefb564d3b0e25892da6d6fe8daf3ac6f4109e0))
- comment -&gt; approve ([d6420b9](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/d6420b9a5eeddf1ddb9790e9620917d2631d4c38))
- fix default config and remove verbose check comment ([3c1fd56](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/3c1fd56e6b7bbe425f255b134c1a56292fa039e0))
- fix the parser and make it more flexible ([22c4e66](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/22c4e6662bc845620b1c32b7261168ee23c7ae0f))
- populate ignored files from correct sources ([23a636c](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/23a636cac506a50b855c09ec2635e872d265d194))
- refactor file parsing, output parsing and exclude generated files ([0de8a64](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/0de8a648be912d734a4cf53207ef2ebd78932c83))
- remove empty strings and fix file exlcusion ([4a875b9](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/4a875b9611db07d79137ec7c582a54021a6c73a4))
- remove respone format and fix test ([5655a16](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/5655a168a1d5e59817cb2d555efcbf3bd9462ca6))
- some fixes and removes unecessary config prop ([01d03be](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/01d03beda469393bf74b1edb9b70f89a8ce5a2e1))
- subtract tokens from tokens remianing ([0b566eb](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/0b566eb89f2f93186d60d2463dcae57b919fef6d))
- use correct type ([9fe162a](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/9fe162a78e1d174f15d9cdc7686b7a7b6461864a))
- use correct type ([0d6b241](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/0d6b2415b9968b9858bf5ad7642a7f296a261938))
- use open router and remove recalc of token ([764eba2](https://github.com/ubiquity-os-marketplace/daemon-pull-review/commit/764eba2bdf7d4efff978fd2e5169f3d3650ad149))
