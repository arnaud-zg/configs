import recommended from "remark-preset-lint-recommended";

/**
 * Framework-agnostic base: remark-lint's recommended rule set (common Markdown correctness
 * issues — broken reference links, duplicate headings, hard tabs, etc.), nothing more opinionated
 * layered on top.
 */
export default {
  plugins: [recommended],
};
