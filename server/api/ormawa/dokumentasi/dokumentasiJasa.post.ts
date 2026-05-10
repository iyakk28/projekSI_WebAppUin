export default defineEventHandler(async (event) => {
  const formdata = await readFormData(event);
  console.log(formdata);
  return true;
});
