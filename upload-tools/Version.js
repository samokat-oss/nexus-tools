
class Version {

    constructor(v) {
        const parts = v.split('.');
        this.major = Number(parts[0]) || 0;
        this.minor = Number(parts[1]) || 0;
        this.patch = Number(parts.slice(2).join('.')) || 0;
    }

    /**
     *
     * @param {Version} v
     */
    compare(v) {
        const major = this._c(this.major, v.major);
        if (major) return major;

        const minor = this._c(this.minor, v.minor);
        if (minor) return minor;

        return this._c(this.patch, v.patch);
    }

    _c(v1, v2) {
        if (v1 > v2) return 1;
        if (v1 < v2) return -1;
        return 0;
    }
}

module.exports = {Version};
