import { MiewTheme, UserTheme } from 'src/theming'

export const transformThemeKeys = (theme: UserTheme, prefix: string) => {
  return Object.entries(theme).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [`${prefix}${key[0].toUpperCase() + key.slice(1)}`]: value
    }),
    {}
  ) as MiewTheme
}
