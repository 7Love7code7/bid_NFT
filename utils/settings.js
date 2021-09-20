/* eslint-disable */

export const set = ($config) => {
    Object.keys($config).forEach((c) => {
        settings[c] = $config[c]
    })
}

export const settings = {}
