function getOmitNetworks() {
  const val = process.env.REACT_APP_OMIT_NETWORKS;
  if (val) {
    return val.split(",");
  }

  return [];
}

export const envConfig = {
  mode: process.env.REACT_APP_MODE,
  siteTitle: process.env.REACT_APP_SITE_TITLE,
  siteDescription: process.env.REACT_APP_SITE_DESCRIPTION,
  omitNetworks: getOmitNetworks(),
};
