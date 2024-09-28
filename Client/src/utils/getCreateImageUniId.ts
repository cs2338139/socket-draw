export const getCreateImageUniId: () => string = () => {
  const currentTime = new Date().getTime();
  const random = Math.floor(Math.random() * 500);

  return `${currentTime}-${random}`;
};
