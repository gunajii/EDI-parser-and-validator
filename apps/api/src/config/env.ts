export const env = {
  port: Number(process.env.PORT || 4000),
  parserUrl: process.env.PARSER_URL || "http://parser:8001",
  validatorUrl: process.env.VALIDATOR_URL || "http://validator:8002",
  aiUrl: process.env.AI_URL || "http://ai:8003"
};
