const { z } = require("zod");

/**
 * Validates request body against a given Zod schema.
 * Handles both typical express.json() bodies and multipart/form-data
 * where the JSON payload is passed as a string in `req.body.data`.
 */
const validateBody = (schema) => (req, res, next) => {
  try {
    let payload = req.body;

    // Support FormData uploads where JSON is inside req.body.data
    if (req.body && req.body.data && typeof req.body.data === "string") {
      try {
        payload = JSON.parse(req.body.data);
      } catch (err) {
        return res.status(400).json({ message: "Invalid JSON in form data." });
      }
    }

    // Validate against Zod schema
    const validatedData = schema.parse(payload);
    
    // Inject validated data back into the request and clear out raw payload
    if (req.body && req.body.data && typeof req.body.data === "string") {
      req.validatedData = validatedData;
    } else {
      req.body = validatedData;
    }
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    return res.status(500).json({ message: "Internal server error during validation" });
  }
};

module.exports = { validateBody };
