export function rejectArguments(command, args = process.argv.slice(2)) {
  if (args.length > 0) {
    console.error(`${command} no acepta argumentos adicionales.`);
    process.exitCode = 2;
    return false;
  }

  return true;
}
