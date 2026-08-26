export function isAutomatedTestEnvironment(environment = process.env) {
  return String(environment.NODE_ENV || '').trim().toLowerCase() === 'test';
}

export function databaseVariableForEnvironment(environment = process.env) {
  return isAutomatedTestEnvironment(environment) ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
}

export function databaseUrlForEnvironment(environment = process.env) {
  const variable = databaseVariableForEnvironment(environment);
  return String(environment[variable] || '').trim();
}

export function requireDatabaseUrlForEnvironment(environment = process.env) {
  const value = databaseUrlForEnvironment(environment);
  if (!value) {
    throw new Error(`${databaseVariableForEnvironment(environment)} is required for NODE_ENV=${environment.NODE_ENV || 'development'}.`);
  }
  return value;
}
