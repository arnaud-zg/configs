import recommended from "remark-preset-lint-recommended";

/**
 * Framework-agnostic base: remark-lint's recommended rule set (common Markdown correctness
 * issues, like broken reference links, duplicate headings, hard tabs), nothing more opinionated
 * layered on top.
 */
export default {
  plugins: [recommended],
};
