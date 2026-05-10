export default defineEventHandler(async (event) => {
  const formdata = await readFormData(event);
  return true;
});
