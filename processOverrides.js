const ERROR = {
  PATH: `Wrong path: no such property.`,
  TYPE: 'Incompatible types',
  ARGUMENTS: 'Configurations object or overriding object is missing.',
  DISABLED: 'Overriding is disabled.',
  PATTERNS: 'pathPatterns property should be an Array.'
}

const getOverriddenConfigurations = (overridingPath, configurations, value) => {
  if (!overridingPath.length) {
    return value
  }
  if (overridingPath[0] === '*') {
    Object.keys(configurations).forEach(i => {
      getOverriddenConfigurations([i].concat(overridingPath.slice(1)), configurations, value)
    })
  } else {
    return { ...configurations, [overridingPath[0]]: getOverriddenConfigurations(overridingPath.slice(1), configurations[overridingPath[0]], value) }
  }
}

const getOverridingValue = (path, overriding) => {
  if (!path.length) return overriding
  return path.reduce((accumulator, pathString) => {
    if (typeof accumulator !== 'object' && !pathString.length) {
      throw new Error(`Failure reason: ${ERROR.PATH}, Override value: ${accumulator}`)
    }
    return accumulator[pathString]
  }, overriding)
}

const getAllPaths = (mask, obj, currentPath = [], paths = []) => {
  if (!mask.length) {
    paths.push(currentPath)
    return
  }
  if (mask[0] === '*') {
    Object.keys(obj).forEach(i => {
      getAllPaths([i].concat(mask.slice(1)), obj, currentPath, paths)
    })
  } else {
    if (obj.hasOwnProperty(mask[0])) throw new Error(`Failure reason: ${ERROR.PATH}, Overriding key: ${mask[0]}`)
    getAllPaths(mask.slice(1), obj[mask[0]], currentPath.concat(mask[0]), paths)
  }
}

export const processOverrides = (configurations, overriding) => {
  if (!configurations || !overriding) throw new Error(`Failure reason: ${ERROR.ARGUMENTS}`)
  if (!configurations.overriding.enabled) {
    console.log(ERROR.DISABLED)
    return configurations
  }
  if (!configurations.overriding.pathPatterns && Array.isArray(configurations.overriding.pathPatterns)) throw new Error(`Failure reason: ${ERROR.PATTERNS}`)
  const pathPatterns = configurations.overriding.pathPatterns
  return pathPatterns.reduce((acc, pathPattern) => {
    const pathPatternArr = pathPattern.split('.')
    const overridingValue = getOverridingValue(pathPatternArr, overriding)
    let paths = []
    getAllPaths(pathPatternArr, configurations, [], paths)
    return paths.reduce((overridden, path) => getOverriddenConfigurations(path, overridden, overridingValue), acc)
  }, Object.assign({}, configurations))
}
