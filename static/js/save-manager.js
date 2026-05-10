(function () {
    function config() {
        return window.DOSGAME_SAVE_CONFIG || {};
    }

    function status(message, isError) {
        var el = document.getElementById('save_status');
        if (!el) {
            return;
        }
        el.textContent = message;
        el.classList.toggle('text-danger', !!isError);
        el.classList.toggle('text-muted', !isError);
    }

    function requestToPromise(request) {
        return new Promise(function (resolve, reject) {
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error); };
        });
    }

    function txDone(transaction) {
        return new Promise(function (resolve, reject) {
            transaction.oncomplete = resolve;
            transaction.onerror = function () { reject(transaction.error); };
            transaction.onabort = function () { reject(transaction.error); };
        });
    }

    function openDb(name) {
        return new Promise(function (resolve, reject) {
            var request = indexedDB.open(name);
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error); };
        });
    }

    function serialize(value) {
        if (value instanceof ArrayBuffer) {
            return { __type: 'ArrayBuffer', data: bytesToBase64(new Uint8Array(value)) };
        }
        if (ArrayBuffer.isView(value)) {
            return {
                __type: value.constructor.name,
                data: bytesToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
            };
        }
        if (value instanceof Date) {
            return { __type: 'Date', data: value.toISOString() };
        }
        if (Array.isArray(value)) {
            return value.map(serialize);
        }
        if (value && typeof value === 'object') {
            var out = {};
            Object.keys(value).forEach(function (key) {
                out[key] = serialize(value[key]);
            });
            return out;
        }
        return value;
    }

    function deserialize(value) {
        if (value && typeof value === 'object' && value.__type) {
            if (value.__type === 'ArrayBuffer') {
                return base64ToBytes(value.data).buffer;
            }
            if (value.__type === 'Date') {
                return new Date(value.data);
            }
            if (window[value.__type] && window[value.__type].BYTES_PER_ELEMENT) {
                return new window[value.__type](base64ToBytes(value.data).buffer);
            }
        }
        if (Array.isArray(value)) {
            return value.map(deserialize);
        }
        if (value && typeof value === 'object') {
            var out = {};
            Object.keys(value).forEach(function (key) {
                out[key] = deserialize(value[key]);
            });
            return out;
        }
        return value;
    }

    function bytesToBase64(bytes) {
        var binary = '';
        var chunk = 0x8000;
        for (var i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(binary);
    }

    function base64ToBytes(base64) {
        var binary = atob(base64);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    function download(filename, text) {
        var blob = new Blob([text], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function readDatabase(name) {
        var db = await openDb(name);
        try {
            var stores = Array.prototype.slice.call(db.objectStoreNames);
            var result = {
                format: 'dosgame-web-indexeddb-save',
                version: 1,
                dbName: name,
                exportedAt: new Date().toISOString(),
                stores: {}
            };
            for (var i = 0; i < stores.length; i++) {
                var storeName = stores[i];
                var tx = db.transaction(storeName, 'readonly');
                var store = tx.objectStore(storeName);
                var keys = await requestToPromise(store.getAllKeys());
                var values = await requestToPromise(store.getAll());
                result.stores[storeName] = keys.map(function (key, index) {
                    return { key: serialize(key), value: serialize(values[index]) };
                });
                await txDone(tx);
            }
            return result;
        } finally {
            db.close();
        }
    }

    async function writeDatabase(save) {
        var name = config().dbName;
        if (!save || save.format !== 'dosgame-web-indexeddb-save') {
            throw new Error('不是有效的 DOS 存档文件');
        }
        if (save.dbName !== name) {
            throw new Error('这个存档属于 "' + save.dbName + '"，当前游戏是 "' + name + '"');
        }
        var db = await openDb(name);
        try {
            var stores = Object.keys(save.stores || {});
            for (var i = 0; i < stores.length; i++) {
                var storeName = stores[i];
                if (!db.objectStoreNames.contains(storeName)) {
                    continue;
                }
                var tx = db.transaction(storeName, 'readwrite');
                var store = tx.objectStore(storeName);
                await requestToPromise(store.clear());
                var entries = save.stores[storeName];
                for (var j = 0; j < entries.length; j++) {
                    store.put(deserialize(entries[j].value), deserialize(entries[j].key));
                }
                await txDone(tx);
            }
        } finally {
            db.close();
        }
    }

    window.exportDosSave = async function () {
        var name = config().dbName;
        var gameName = config().gameName || name;
        try {
            status('正在导出存档...');
            var data = await readDatabase(name);
            var safeName = gameName.replace(/[\\/:*?"<>|]+/g, '_');
            var stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
            download(safeName + '_' + stamp + '.dossave', JSON.stringify(data));
            status('存档已导出。');
        } catch (error) {
            status('导出失败：' + error.message, true);
        }
    };

    window.importDosSave = async function (files) {
        if (!files || files.length === 0) {
            return;
        }
        try {
            status('正在导入存档...');
            var text = await files[0].text();
            await writeDatabase(JSON.parse(text));
            status('存档已导入，刷新页面后生效。');
        } catch (error) {
            status('导入失败：' + error.message, true);
        } finally {
            var input = document.getElementById('save_import_file');
            if (input) {
                input.value = '';
            }
        }
    };

    window.clearDosSave = async function () {
        var name = config().dbName;
        if (!window.confirm('确定清除当前游戏在这个浏览器里的本地存档？')) {
            return;
        }
        try {
            await requestToPromise(indexedDB.deleteDatabase(name));
            status('本地存档已清除，刷新页面后生效。');
        } catch (error) {
            status('清除失败：' + error.message, true);
        }
    };
})();
