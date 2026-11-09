// Helper function to create custom error objects with status codes

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

module.exports = createError;
