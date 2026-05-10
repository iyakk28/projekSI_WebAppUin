export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Tidak ada data yang dikirim",
    });
  }

  const getField = (name: string): string => {
    const field = formData.find((f) => f.name == name);
    return field && field.data ? Buffer.from(field.data).toString("utf-8") : "";
  };
  return true;
});
