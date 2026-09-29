// ═══════════════════════════════════════════════════════════════════
//  ENVOLTORIO · login, bóveda Face ID, sesiones, almacén y arranque
//  Plano RECUPERADO en v315: este fichero es la transcripción VERBATIM del
//  envoltorio que llevaba meses en producción solo como minificado, con los
//  enlaces al SDK sustituidos por imports reales. La lógica no se ha
//  reescrito: los nombres cortos (PantallaLogin=pantalla de login, Raiz=raíz, crearAlmacen=
//  almacén, idSesion=id de sesión…) se irán renombrando en fases posteriores,
//  SIEMPRE de uno en uno y con las baterías delante.
//  Correcciones incluidas: «uid» sin declarar en bh10Fichaje.alta → t.uid.
// ═══════════════════════════════════════════════════════════════════
import {puedeEscribirClave} from '../src/permisos.js';
import * as ReactNS from 'react';
import * as JSXNS from 'react/jsx-runtime';
import * as RDOMNS from 'react-dom/client';
import {initializeApp} from 'firebase/app';
import {getAuth,setPersistence,browserLocalPersistence,onAuthStateChanged,
        signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {initializeFirestore,persistentLocalCache,persistentSingleTabManager,
        doc,collection,getDoc,getDocs,setDoc,addDoc,deleteDoc,onSnapshot,
        query,where,orderBy,serverTimestamp} from 'firebase/firestore';

// ── puentes con los nombres del minificado (se renombrarán por fases) ──
const Io=ReactNS, dt=JSXNS, fne=RDOMNS;
const CO=initializeApp;
const eP=getAuth, XO=setPersistence, cv=browserLocalPersistence,
      JO=onAuthStateChanged, nA=signInWithEmailAndPassword, rA=signOut;
const WV=initializeFirestore, aU=persistentLocalCache, sU=persistentSingleTabManager,
      cn=doc, pa=collection, Qa=getDoc, Gs=getDocs, Ni=setDoc, rU=addDoc,
      ql=deleteDoc, oU=onSnapshot, PN=query, ZV=where, eU=orderBy, lU=serverTimestamp;

var a=JSXNS,ee={default:ReactNS};if(typeof window<"u"){window.__BH10_R=ee.default||ee;window.__BH10_JSX=a;}var BH10cargada=null,CargadorApp=function(){var st=ee.default.useState(BH10cargada),App=st[0],set=st[1];ee.default.useEffect(function(){if(App)return;var f=(typeof window<"u")&&window.__BH10_APPF;if(!f){set(function(){return function(){return null}});return}f().then(function(C){BH10cargada=C;set(function(){return C})}).catch(function(e){console.error("no se pudo cargar la app",e)})},[App]);return App?(0,a.jsx)(App,{}):(0,a.jsx)("div",{style:{padding:40,textAlign:"center",fontSize:13,opacity:.6},children:"Cargando\u2026"})};/* dt viene de los puentes de arriba */typeof window<"u"&&(window.__BH10_STANDALONE=!0,window.__BH10_MULTI=!0);
var CONFIG_FIREBASE = {
        apiKey: "AIzaSyB6Nvqq6CrZGjly0V8iXg872Z3bV7aQjPU",
        authDomain: "b10h-facturas.firebaseapp.com",
        projectId: "b10h-facturas",
        storageBucket: "b10h-facturas.firebasestorage.app",
        messagingSenderId: "940248180337",
        appId: "1:940248180337:web:989686e6c5fcb80b1c9dd0"
    },
    appFirebase = CO(CONFIG_FIREBASE),
    autenticacion = eP(appFirebase),
    baseDatos = WV(appFirebase, {
        localCache: aU({
            tabManager: sU()
        })
    });
XO(autenticacion, cv).catch(t => console.warn("persistence", t));
var BH10D = null,
    BH10P = null;
try {
    var stB = document.createElement("style");
    stB.textContent = ".grecaptcha-badge{visibility:hidden !important}";
    document.head.appendChild(stB)
} catch (eb) {}
var ACKS = "6Lc5AZMtAAAAAKBCZlXQZpQjF2PtBtQRRUod8Jx-",
    ACKt = null,
    ACKe = 0,
    ACKp = null;

function ACKsc() {
    return new Promise((r9, j9) => {
        if (window.grecaptcha && window.grecaptcha.execute) return window.grecaptcha.ready(r9);
        var s9 = document.createElement("script");
        s9.src = "https://www.google.com/recaptcha/api.js?render=" + ACKS;
        s9.onload = () => window.grecaptcha.ready(r9);
        s9.onerror = () => j9(new Error("recaptcha no cargó"));
        document.head.appendChild(s9)
    })
}
async function ACKget(f9) {
    var n9 = Date.now();
    if (!f9 && ACKt && n9 < ACKe - 6e4) return {
        token: ACKt
    };
    if (ACKp) return ACKp;
    ACKp = (async () => {
        try {
            await ACKsc();
            var rt9 = await window.grecaptcha.execute(ACKS, {
                action: "fire_app_check"
            });
            var rs9 = await fetch("https://content-firebaseappcheck.googleapis.com/v1/projects/" + CONFIG_FIREBASE.projectId + "/apps/" + CONFIG_FIREBASE.appId + ":exchangeRecaptchaV3Token?key=" + CONFIG_FIREBASE.apiKey, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    recaptcha_v3_token: rt9
                })
            });
            var d9 = await rs9.json();
            if (d9 && d9.token) {
                ACKt = d9.token;
                ACKe = Date.now() + (parseFloat(d9.ttl) || 3600) * 1e3;
                return {
                    token: ACKt
                }
            }
            return {
                token: "",
                error: new Error("canje: " + JSON.stringify(d9).slice(0, 120))
            }
        } catch (e9) {
            return {
                token: "",
                error: e9
            }
        } finally {
            ACKp = null
        }
    })();
    return ACKp
}
try {
    appFirebase.container.addComponent({
        name: "app-check-internal",
        type: "PUBLIC",
        multipleInstances: !1,
        serviceProps: {},
        instantiationMode: "LAZY",
        onInstanceCreated: null,
        instanceFactory: () => ({
            getToken: ACKget,
            getLimitedUseToken: () => ACKget(!0),
            addTokenListener: () => {},
            removeTokenListener: () => {}
        })
    });
    appFirebase.container.getProvider("app-check-internal").getImmediate({
        optional: !0
    });
    ACKget().then(t9 => console.log("AppCheck:", t9 && t9.token ? "token ✓" : "sin token", t9 && t9.error || "")).catch(() => {});
    window.__BH10_APPCHECK = {
        estado: () => ({
            token: !!ACKt,
            caduca: ACKe ? new Date(ACKe).toISOString() : null
        }),
        renovar: () => ACKget(!0)
    };
} catch (eac) {
    console.warn("AppCheck no cosido:", eac)
}
var idSesion = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
    RDe = {
        db: baseDatos,
        doc: (t, ...e) => cn(t, ...e),
        collection: (t, ...e) => pa(t, ...e),
        setDoc: Ni,
        getDoc: Qa,
        deleteDoc: ql,
        onSnapshot: oU,
        snapshotDocs: t => t.docChanges().map(e => ({
            id: e.doc.id,
            data: e.doc.data(),
            removed: e.type === "removed"
        }))
    },
    NDe = {
        "bh10-fc-v3": 1,
        "bh10-contratos": 1,
        "bh10-employees": 1,
        "bh10-provcat": 1,
        "bh10-nominas": 1,
        "bh10-remesas": 1
    },
    LI = 9e5,
    kDe = 15e4,
    DDe = () => typeof CompressionStream < "u" && typeof DecompressionStream < "u",
    LDe = t => {
        let e = new Uint8Array(t),
            n = "",
            r = 8192;
        for (let o = 0; o < e.length; o += r) n += String.fromCharCode.apply(null, e.subarray(o, o + r));
        return btoa(n)
    },
    MDe = t => {
        let e = atob(t),
            n = new Uint8Array(e.length);
        for (let r = 0; r < e.length; r++) n[r] = e.charCodeAt(r);
        return n
    },
    FDe = async t => {
        let e = new CompressionStream("gzip"),
            n = e.writable.getWriter();
        return n.write(new TextEncoder().encode(t)), n.close(), LDe(await new Response(e.readable).arrayBuffer())
    }, hne = async t => {
        let e = new DecompressionStream("gzip"),
            n = e.writable.getWriter();
        return n.write(MDe(t)), n.close(), new TextDecoder().decode(await new Response(e.readable).arrayBuffer())
    }, crearAlmacen = (t, e, n, r) => {
        let o = !!(r && r.soloLectura),
            i = r && r.sub ? String(r.sub) : "",
            s = r && r.esperaSueno || 25e3,
            l = i ? [e, "sub", i] : [e],
            c = "bh10ls:" + e + ":" + i + ":",
            f = "bh10lsu:" + e + ":" + i + ":",
            g = () => t.collection(t.db, "empresas", ...l, "kv"),
            h = T => t.doc(t.db, "empresas", ...l, "kv", T),
            S = {
                fase: "iniciando",
                error: "",
                ultimaEscritura: 0,
                errorEscritura: "",
                pendientes: 0,
                conflicto: null
            },
            w = (T, C) => {
                S.fase = T, S.error = C || ""
            },
            _ = [],
            I = async (T, C, N, z) => {
                if (NDe[T]) {
                    let R = typeof z == "number" ? z : +(localStorage.getItem(f + T) || 0);
                    try {
                        let M = await t.getDoc(h(T));
                        if (M && M.exists && M.exists()) {
                            let U = M.data() || {};
                            if (U.u && U.dev !== n && U.u > R + 1500) {
                                S.conflicto = {
                                    key: T,
                                    remoto: U.u,
                                    mio: R
                                };
                                try {
                                    localStorage.setItem(f + T, String(R))
                                } catch {}
                                throw w("conflicto", "otro dispositivo tiene datos más recientes"), new Error("CONFLICTO: la nube tiene datos más nuevos de otro dispositivo")
                            }
                        }
                    } catch (M) {
                        if (String(M.message || "").startsWith("CONFLICTO")) throw M
                    }
                }
                let D = C,
                    F = 0;
                if (C.length > kDe && DDe()) try {
                    D = await FDe(C), F = 1
                } catch {
                    D = C, F = 0
                }
                if (D.length <= LI) await t.setDoc(h(T), {
                    v: D,
                    z: F,
                    p: 0,
                    u: N,
                    dev: n
                });
                else {
                    let R = Math.ceil(D.length / LI);
                    for (let M = 0; M < R; M++) await t.setDoc(h(T + "~" + M), {
                        v: D.slice(M * LI, (M + 1) * LI),
                        u: N,
                        dev: n
                    });
                    await t.setDoc(h(T), {
                        p: R,
                        z: F,
                        u: N,
                        dev: n
                    })
                }
            }, k = async (T, C) => {
                let N;
                if (C && +C.p > 0) {
                    let z = [];
                    for (let D = 0; D < +C.p; D++) {
                        let F = await t.getDoc(h(T + "~" + D));
                        z.push((F && F.data && F.data() || {}).v || "")
                    }
                    N = z.join("")
                } else N = (C || {}).v;
                if (typeof N != "string") return null;
                if (C && C.z) try {
                    N = await hne(N)
                } catch {
                    return null
                }
                return N
            };
        return {
            async get(T) {
                let C = localStorage.getItem(c + T);
                if (C === null) throw new Error("Key not found: " + T);
                return {
                    key: T,
                    value: C
                }
            },
            async set(T, C) {
                let N = String(C);
                if (o) return {
                    key: T,
                    value: N,
                    lector: !0
                };
                // v364 · la clave tiene área: un miembro solo escribe las de las áreas donde es admin
                if (window.BH10_PERMISOS && !puedeEscribirClave(window.BH10_PERMISOS, T)) {
                    console.warn('storage.set rechazado: sin permiso para', T);
                    return { key: T, value: N, lector: !0, sinPermiso: !0 };
                }
                if (localStorage.getItem(c + T) === N) return {
                    key: T,
                    value: N
                };
                let z = +(localStorage.getItem(f + T) || 0),
                    D = Date.now();
                try {
                    localStorage.setItem(c + T, N), localStorage.setItem(f + T, String(D))
                } catch (F) {
                    console.error("localStorage lleno:", F)
                }
                return S.pendientes++, I(T, N, D, z).then(() => {
                    S.pendientes--, S.ultimaEscritura = Date.now(), S.errorEscritura = "", w(S.fase === "error" ? "ok" : S.fase, S.error)
                }).catch(F => {
                    S.pendientes--;
                    let R = String(F && F.code || F);
                    console.error("Firestore set", T, F), S.errorEscritura = R, w("error", R)
                }), {
                    key: T,
                    value: N
                }
            },
            async delete(T) {
                if (!o && window.BH10_PERMISOS && !puedeEscribirClave(window.BH10_PERMISOS, T)) {
                    console.warn('storage.delete rechazado: sin permiso para', T);
                    return { key: T, deleted: !1, lector: !0, sinPermiso: !0 };
                }
                return o ? {
                    key: T,
                    deleted: !0,
                    lector: !0
                } : (localStorage.removeItem(c + T), localStorage.removeItem(f + T), t.deleteDoc(h(T)).catch(C => console.error("Firestore delete", T, C)), {
                    key: T,
                    deleted: !0
                })
            },
            async list(T) {
                let C = [];
                for (let N = 0; N < localStorage.length; N++) {
                    let z = localStorage.key(N);
                    if (z && z.startsWith(c)) {
                        let D = z.slice(c.length);
                        if (D.indexOf("~") >= 0) continue;
                        (!T || D.startsWith(T)) && C.push(D)
                    }
                }
                return {
                    keys: C,
                    prefix: T || ""
                }
            },
            getStatus: () => ({
                ...S
            }),
            onRemoteChange: T => (_.push(T), () => {
                let C = _.indexOf(T);
                C >= 0 && _.splice(C, 1)
            }),
            start() {
                return new Promise(T => {
                    let C = !0,
                        N = null,
                        z = !1,
                        D = null,
                        F = setTimeout(() => {
                            C && (C = !1, w("sin-conexion"), T("timeout"))
                        }, 8e3),
                        R = () => {
                            N || (N = t.onSnapshot(g(), async q => {
                                let Y = t.snapshotDocs(q);
                                for (let G of Y) {
                                    let me = G.id,
                                        ye = G.data;
                                    if (me.indexOf("~") >= 0) continue;
                                    if (G.removed) {
                                        localStorage.removeItem(c + me), localStorage.removeItem(f + me);
                                        continue
                                    }
                                    if (!ye || ye.dev === n) continue;
                                    let H = +(localStorage.getItem(f + me) || 0);
                                    if (ye.u && ye.u < H) continue;
                                    let Q = await k(me, ye);
                                    Q !== null && localStorage.getItem(c + me) !== Q && (localStorage.setItem(c + me, Q), localStorage.setItem(f + me, String(ye.u || Date.now())), C || _.forEach(re => {
                                        try {
                                            re(me, Q)
                                        } catch (J) {
                                            console.error(J)
                                        }
                                    }))
                                }
                                C ? (C = !1, clearTimeout(F), w("ok"), T("ok")) : w("ok")
                            }, q => {
                                console.error("Firestore onSnapshot", q), w("error", String(q && q.code || q)), C && (C = !1, clearTimeout(F), T("error"))
                            }))
                        },
                        M = () => {
                            if (!(z || !N)) {
                                try {
                                    N()
                                } catch {}
                                N = null, z = !0, S.dormida = !0, w("dormida")
                            }
                        },
                        U = () => {
                            D && (clearTimeout(D), D = null), z && (z = !1, S.dormida = !1, w("conectando"), R())
                        },
                        $ = () => {
                            document.hidden ? D || (D = setTimeout(M, s)) : U()
                        };
                    try {
                        R(), document.addEventListener("visibilitychange", $), window.addEventListener("pagehide", () => {
                            D && clearTimeout(D), M()
                        })
                    } catch (q) {
                        console.error("Firestore start", q), w("error", String(q && q.message || q)), C && (C = !1, clearTimeout(F), T("error"))
                    }
                })
            }
        }
    }, Jb = "bh10-faceid", _5 = "bh10-vault", jDe = t => btoa(String.fromCharCode(...new Uint8Array(t))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), zDe = (t, e) => {
        try {
            localStorage.setItem(_5, btoa(unescape(encodeURIComponent(JSON.stringify({
                e: t,
                p: e
            })))))
        } catch {}
    }, C5 = () => {
        try {
            let t = localStorage.getItem(_5);
            return t ? JSON.parse(decodeURIComponent(escape(atob(t)))) : null
        } catch {
            return null
        }
    }, BDe = () => {
        try {
            localStorage.removeItem(_5)
        } catch {}
    }, dne = () => typeof window < "u" && !!window.PublicKeyCredential, VDe = async t => {
        let e = crypto.getRandomValues(new Uint8Array(32)),
            n = await navigator.credentials.create({
                publicKey: {
                    challenge: e,
                    rp: {
                        name: "BH10",
                        id: location.hostname
                    },
                    user: {
                        id: new TextEncoder().encode(t).slice(0, 64),
                        name: t,
                        displayName: t
                    },
                    pubKeyCredParams: [{
                        type: "public-key",
                        alg: -7
                    }, {
                        type: "public-key",
                        alg: -257
                    }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        residentKey: "preferred"
                    },
                    timeout: 6e4
                }
            });
        if (!n) throw new Error("no-cred");
        return localStorage.setItem(Jb, jDe(n.rawId)), !0
    }, UDe = async () => {
        let t = localStorage.getItem(Jb);
        if (!t) throw new Error("sin-credencial");
        let e = atob(t.replace(/-/g, "+").replace(/_/g, "/")),
            n = new Uint8Array(e.length);
        for (let o = 0; o < e.length; o++) n[o] = e.charCodeAt(o);
        if (!await navigator.credentials.get({
                publicKey: {
                    challenge: crypto.getRandomValues(new Uint8Array(32)),
                    allowCredentials: [{
                        type: "public-key",
                        id: n,
                        transports: ["internal"]
                    }],
                    userVerification: "required",
                    timeout: 6e4
                }
            })) throw new Error("cancelado");
        return !0
    }, ps = {
        bg: "#0F172A",
        sf: "#1B2540",
        bd: "#334155",
        tx: "#E2E8F0",
        mt: "#94A3B8",
        ac: "#7BF07B",
        dn: "#EF4444"
    }, Pantallita = ({
        texto: t
    }) => (0, dt.jsx)("div", {
        style: {
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0F172A",
            color: "#94A3B8",
            fontFamily: "system-ui",
            fontSize: 13
        },
        children: t
    });

function PantallaLogin({
    onEntrar: t,
    faceDisponible: e,
    onFace: n
}) {
    let [r, o] = (0, Io.useState)(""), [i, s] = (0, Io.useState)(""), [l, c] = (0, Io.useState)(""), [f, g] = (0, Io.useState)(!1), h = async () => {
        if (!r.trim() || !i) {
            c("Escribe tu correo y tu contraseña");
            return
        }
        g(!0), c("");
        try {
            await t(r.trim(), i)
        } catch (_) {
            let I = String(_ && _.code || _);
            c(I.includes("invalid-credential") || I.includes("wrong-password") || I.includes("user-not-found") ? "Correo o contraseña incorrectos" : I.includes("too-many-requests") ? "Demasiados intentos. Espera un momento." : I.includes("network") ? "Sin conexión. Inténtalo de nuevo." : "No se pudo entrar: " + I)
        }
        g(!1)
    }, S = async () => {
        g(!0), c("");
        try {
            await n()
        } catch {
            c("No se pudo entrar con Face ID. Usa tu contraseña.")
        }
        g(!1)
    }, w = {
        caja: {
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: ps.bg,
            color: ps.tx,
            fontFamily: "system-ui,-apple-system,sans-serif",
            padding: 24
        },
        card: {
            width: "100%",
            maxWidth: 340
        },
        input: {
            width: "100%",
            boxSizing: "border-box",
            background: ps.sf,
            border: `1px solid ${ps.bd}`,
            borderRadius: 10,
            color: ps.tx,
            padding: "13px 12px",
            fontSize: 16,
            outline: "none",
            marginBottom: 10
        },
        btn: {
            width: "100%",
            padding: 14,
            borderRadius: 11,
            border: "none",
            background: ps.ac,
            color: "#04120C",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer"
        },
        face: {
            width: "100%",
            padding: 15,
            borderRadius: 11,
            border: "none",
            background: ps.ac,
            color: "#04120C",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            marginBottom: 14
        }
    };
    return (0, dt.jsx)("div", {
        style: w.caja,
        children: (0, dt.jsxs)("div", {
            style: w.card,
            children: [(0, dt.jsxs)("div", {
                style: {
                    textAlign: "center",
                    marginBottom: 26
                },
                children: [(0, dt.jsxs)("div", {
                    style: {
                        fontSize: 34,
                        fontWeight: 900,
                        letterSpacing: "-1px"
                    },
                    children: [(0, dt.jsx)("span", {
                        style: {
                            color: ps.ac
                        },
                        children: "BIO"
                    }), (0, dt.jsx)("span", {
                        style: {
                            color: "#B0E8E8"
                        },
                        children: "H"
                    })]
                }), (0, dt.jsx)("div", {
                    style: {
                        fontSize: 13,
                        fontWeight: 700,
                        marginTop: 6
                    },
                    children: "Espacio privado"
                }), (0, dt.jsx)("div", {
                    style: {
                        fontSize: 11,
                        color: ps.mt,
                        marginTop: 3
                    },
                    children: "BIG HOUSE 2010 · acceso restringido"
                }), (0, dt.jsx)("div", {
                    style: {
                        fontSize: 9,
                        color: ps.mt,
                        marginTop: 6,
                        opacity: .7,
                        lineHeight: 1.4
                    },
                    children: "Protegido por reCAPTCHA · se aplican la Política de privacidad y las Condiciones del servicio de Google"
                })]
            }), e && (0, dt.jsxs)(dt.Fragment, {
                children: [(0, dt.jsx)("button", {
                    style: w.face,
                    disabled: f,
                    onClick: S,
                    children: "🔒 Entrar con Face ID"
                }), (0, dt.jsx)("div", {
                    style: {
                        textAlign: "center",
                        fontSize: 11,
                        color: ps.mt,
                        marginBottom: 14
                    },
                    children: "— o con tu contraseña —"
                })]
            }), (0, dt.jsx)("input", {
                style: w.input,
                type: "email",
                inputMode: "email",
                autoComplete: "username",
                placeholder: "Correo",
                value: r,
                onChange: _ => o(_.target.value)
            }), (0, dt.jsx)("input", {
                style: w.input,
                type: "password",
                autoComplete: "current-password",
                placeholder: "Contraseña",
                value: i,
                onChange: _ => s(_.target.value),
                onKeyDown: _ => {
                    _.key === "Enter" && h()
                }
            }), l && (0, dt.jsx)("div", {
                style: {
                    background: "rgba(239,68,68,.12)",
                    border: `1px solid ${ps.dn}55`,
                    borderRadius: 9,
                    padding: "9px 11px",
                    fontSize: 12,
                    color: "#FCA5A5",
                    marginBottom: 10
                },
                children: l
            }), (0, dt.jsx)("button", {
                style: {
                    ...w.btn,
                    opacity: f ? .6 : 1
                },
                disabled: f,
                onClick: h,
                children: f ? "Entrando…" : "Entrar"
            }), (0, dt.jsx)("div", {
                style: {
                    textAlign: "center",
                    fontSize: 10,
                    color: "#475569",
                    marginTop: 18
                },
                children: "dispositivo · v257"
            })]
        })
    })
}

function $De({
    lista: t,
    correo: e,
    onElegir: n,
    onSalir: r
}) {
    let o = {
        caja: {
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            background: "#131C31",
            color: "#E2E8F0",
            fontFamily: "system-ui",
            padding: 24
        },
        card: {
            width: "100%",
            maxWidth: 360,
            textAlign: "left",
            background: "#1B2540",
            border: "1px solid #334155",
            borderRadius: 14,
            padding: "16px 18px",
            cursor: "pointer",
            color: "#E2E8F0"
        }
    };
    return (0, dt.jsxs)("div", {
        style: o.caja,
        children: [(0, dt.jsx)("div", {
            style: {
                fontSize: 38
            },
            children: "🏢"
        }), (0, dt.jsx)("div", {
            style: {
                fontWeight: 800,
                fontSize: 17
            },
            children: "¿A qué empresa entras?"
        }), (0, dt.jsx)("div", {
            style: {
                fontSize: 11,
                color: "#94A3B8"
            },
            children: e || ""
        }), t.map(i => (0, dt.jsx)("button", {
            style: o.card,
            onClick: () => n(i.sub || ""),
            children: (0, dt.jsx)("div", {
                style: {
                    fontWeight: 800,
                    fontSize: 14
                },
                children: i.nombre || "Empresa"
            })
        }, i.sub || "principal")), (0, dt.jsx)("button", {
            style: {
                background: "none",
                border: "none",
                color: "#94A3B8",
                fontSize: 11,
                textDecoration: "underline",
                cursor: "pointer",
                marginTop: 6
            },
            onClick: r,
            children: "Cerrar sesión"
        })]
    })
}

function WDe({
    empresa: t,
    onElegir: e,
    onVolver: n
}) {
    let r = {
        caja: {
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            background: "#131C31",
            color: "#E2E8F0",
            fontFamily: "system-ui",
            padding: 24
        },
        card: {
            width: "100%",
            maxWidth: 360,
            textAlign: "left",
            background: "#1B2540",
            border: "1px solid #334155",
            borderRadius: 14,
            padding: "16px 18px",
            cursor: "pointer",
            color: "#E2E8F0"
        }
    };
    return (0, dt.jsxs)("div", {
        style: r.caja,
        children: [(0, dt.jsx)("div", {
            style: {
                fontSize: 34
            },
            children: "🔑"
        }), (0, dt.jsx)("div", {
            style: {
                fontWeight: 800,
                fontSize: 17,
                textAlign: "center"
            },
            children: t
        }), (0, dt.jsx)("div", {
            style: {
                fontSize: 12,
                color: "#94A3B8",
                marginTop: -6
            },
            children: "¿Cómo quieres entrar?"
        }), (0, dt.jsxs)("button", {
            style: {
                ...r.card,
                borderColor: "#10B98155"
            },
            onClick: () => e("admin"),
            children: [(0, dt.jsx)("div", {
                style: {
                    fontWeight: 800,
                    fontSize: 14,
                    color: "#10B981"
                },
                children: "✏️ Administrador"
            }), (0, dt.jsx)("div", {
                style: {
                    fontSize: 11,
                    color: "#94A3B8",
                    marginTop: 3
                },
                children: "Crear, editar, escanear, remesar — todo."
            })]
        }), (0, dt.jsxs)("button", {
            style: {
                ...r.card,
                borderColor: "#F59E0B55"
            },
            onClick: () => e("lector"),
            children: [(0, dt.jsx)("div", {
                style: {
                    fontWeight: 800,
                    fontSize: 14,
                    color: "#F59E0B"
                },
                children: "👁 Solo consulta"
            }), (0, dt.jsx)("div", {
                style: {
                    fontSize: 11,
                    color: "#94A3B8",
                    marginTop: 3
                },
                children: "Ver paneles, facturas, nóminas y contratos sin poder tocar nada."
            })]
        }), (0, dt.jsx)("div", {
            style: {
                fontSize: 10,
                color: "#64748B",
                maxWidth: 320,
                textAlign: "center"
            },
            children: "Se recuerda en este dispositivo — cámbialo cuando quieras desde Ajustes."
        }), (0, dt.jsx)("button", {
            style: {
                background: "none",
                border: "none",
                color: "#94A3B8",
                fontSize: 11,
                textDecoration: "underline",
                cursor: "pointer",
                marginTop: 2
            },
            onClick: n,
            children: "← Cambiar de empresa"
        })]
    })
}

function Raiz() {
    let [t, e] = (0, Io.useState)(null), [n, r] = (0, Io.useState)(!1), [o, i] = (0, Io.useState)(!1), [s, l] = (0, Io.useState)(null), [c, f] = (0, Io.useState)(() => {
        try {
            let _ = localStorage.getItem("bh10-empresa");
            return _ === null ? null : _
        } catch {
            return null
        }
    }), [g, h] = (0, Io.useState)(() => {
        try {
            return localStorage.getItem("bh10-modo") || null
        } catch {
            return null
        }
    }), [S, w] = (0, Io.useState)(() => {
        try {
            return !!localStorage.getItem(Jb)
        } catch {
            return !1
        }
    });
    if ((0, Io.useEffect)(() => JO(autenticacion, _ => {
            e(_ || null), r(!0)
        }), []), (0, Io.useEffect)(() => {
            if (!t) {
                l(null);
                return
            }(async () => {
                BH10D = t.uid;
                BH10P = null;
                try {
                    let mj0 = await Qa(cn(baseDatos, "miembros", t.uid));
                    if (mj0.exists()) {
                        let dj0 = mj0.data() || {};
                        if (dj0.dueno && dj0.estado === "activo" && String(dj0.dueno) !== t.uid) {
                            BH10D = String(dj0.dueno);
                            BH10P = dj0.permisos || {};
                            window.BH10_MIEMBRO = {
                                email: dj0.email || t.email || "",
                                nombre: dj0.nombre || ""
                            }
                        }
                    }
                } catch (ej0) {
                    BH10D = t.uid;
                    BH10P = null
                }
                window.__BH10_DUENO = BH10D;
                window.BH10_PERMISOS = BH10P;
                // v366 · interruptor remoto (Jesús, 05-09-2026): un miembro escucha SU ficha en vivo;
                // si el dueño lo suspende o lo quita, en segundos cierra sesión y vacía la copia local
                // en todos sus aparatos con conexión. Los permisos afinados desde Master llegan igual.
                if (BH10P) try {
                    oU(cn(baseDatos, "miembros", t.uid), (snap) => {
                        const d = snap.exists() ? (snap.data() || {}) : null;
                        if (!d || d.estado !== "activo" || String(d.dueno) !== BH10D) {
                            console.warn("acceso retirado por el dueño: se cierra la sesión");
                            try { window.bh10LimpiarCache && window.bh10LimpiarCache(); } catch {}
                            rA(autenticacion).finally(() => location.reload());
                            return;
                        }
                        if (d.permisos) { BH10P = d.permisos; window.BH10_PERMISOS = d.permisos; }
                    }, (e) => console.warn("ficha de miembro", e && e.code));
                } catch {}
                let _ = [{
                    sub: "",
                    nombre: "BIG HOUSE 2010"
                }];
                try {
                    let k = await Qa(cn(baseDatos, "empresas", BH10D, "kv", "bh10-empresas"));
                    if (k.exists() && k.data() && k.data().v) {
                        let T = JSON.parse(k.data().v);
                        Array.isArray(T) && T.length && T.some(C => C && C.sub === "") && (_ = T)
                    }
                } catch (k) {
                    console.warn("empresas:", k && k.code || k)
                }
                l(_);
                let I = async k => {
                    await Ni(cn(baseDatos, "empresas", BH10D, "kv", "bh10-empresas"), {
                        v: JSON.stringify(k),
                        t: Date.now(),
                        tab: idSesion
                    }), _ = k, l(k)
                };
                window.bh10Empresas = {
                    listar: () => _,
                    crear: async k => {
                        let T = "e" + Math.random().toString(36).slice(2, 7);
                        return await I([..._, {
                            sub: T,
                            nombre: String(k || "Empresa nueva")
                        }]), T
                    },
                    renombrar: async (k, T) => {
                        await I(_.map(C => C.sub === (k || "") ? {
                            ...C,
                            nombre: String(T)
                        } : C))
                    }
                }, window.bh10CambiarEmpresa = () => {
                    try {
                        localStorage.removeItem("bh10-empresa"), localStorage.removeItem("bh10-modo")
                    } catch {}
                    location.reload()
                }, window.bh10Miembros = {
                    poner: async (u9, d9) => {
                        let pm9 = (d9 && d9.permisos) || {};
                        let esc9 = Object.keys(pm9).some(k9 => pm9[k9] === "admin");
                        await Ni(cn(baseDatos, "miembros", String(u9)), {
                            dueno: t.uid,
                            email: String(d9 && d9.email || ""),
                            nombre: String(d9 && d9.nombre || ""),
                            permisos: pm9,
                            estado: String(d9 && d9.estado || "activo"),
                            escritor: esc9,
                            t: Date.now()
                        })
                    },
                    quitar: async (u9) => {
                        await ql(cn(baseDatos, "miembros", String(u9)))
                    }
                }
            })()
        }, [t]), (0, Io.useEffect)(() => {
            if (!t || c === null || !g || !s) return;
            let _ = s.find(C => (C.sub || "") === c) || {
                nombre: "Empresa"
            };
            window.BH10_ROL = g, window.BH10_EMPRESA = {
                sub: c,
                nombre: _.nombre || ""
            }, window.__BH10_MULTI = !0, window.__BH10_STANDALONE = !0, window.__BH10_PERMITIR_SIEMBRA = c === "";
            let I = c ? ["empresas", BH10D, "sub", c] : ["empresas", BH10D],
                k = crearAlmacen(RDe, BH10D, idSesion, {
                    soloLectura: g === "lector" || !!(BH10P && !Object.keys(BH10P).some(pk0 => BH10P[pk0] === "admin")),
                    sub: c || null
                });
            window.storage = k;
            let T = 9e5;
            window.bh10Adj = {
                subir: async (C, N) => {
                    if (g === "lector") return null;
                    let z = await new Promise((F, R) => {
                        let M = new FileReader;
                        M.onload = () => F(String(M.result).split(",")[1] || ""), M.onerror = () => R(new Error("No se pudo leer el archivo")), M.readAsDataURL(N)
                    });
                    if (!z) throw new Error("El archivo llegó vacío");
                    let D = {
                        mime: N.type || "application/octet-stream",
                        nombre: String(N.name || "documento").slice(0, 90),
                        bytes: N.size,
                        t: Date.now()
                    };
                    if (z.length <= T) await Ni(cn(baseDatos, ...I, "adj", C), {
                        v: z,
                        p: 0,
                        ...D
                    });
                    else {
                        let F = Math.ceil(z.length / T);
                        if (F > 12) throw new Error("El documento pesa demasiado (" + Math.round(N.size / 1024 / 1024 * 10) / 10 + " MB). Envía una foto o comprime el PDF.");
                        for (let R = 0; R < F; R++) await Ni(cn(baseDatos, ...I, "adj", C + "~" + R), {
                            v: z.slice(R * T, (R + 1) * T)
                        });
                        await Ni(cn(baseDatos, ...I, "adj", C), {
                            p: F,
                            ...D
                        })
                    }
                    return C
                },
                refId: C => C ? (typeof C == "object" && (C = C.id || C.path || ""), String(C).replace(/^adj\//, "").trim()) : "",
                // v352 · ¿está el documento CONFIRMADO en la nube? La caché local
                // (persistentLocalCache) enseña el documento en este aparato aunque
                // los trozos sigan en cola de subida: por eso «se ve en la app y no
                // entra en el zip». hasPendingWrites es la marca de Firestore para
                // «escrito aquí, aún no aceptado por el servidor».
                enNube: async C => {
                    let N = window.bh10Adj.refId(C);
                    if (!N) return {ok: false, motivo: "sin enlace"};
                    let z = await Qa(cn(baseDatos, ...I, "adj", String(N)));
                    if (!z.exists()) return {ok: false, motivo: "no existe en la nube"};
                    if (z.metadata && z.metadata.hasPendingWrites) return {ok: false, motivo: "pendiente de subir (cabecera en cola)"};
                    let p = +(z.data() || {}).p || 0;
                    for (let U = 0; U < p; U++) {
                        let $ = await Qa(cn(baseDatos, ...I, "adj", String(N) + "~" + U));
                        if (!$.exists()) return {ok: false, motivo: "falta el trozo " + (U + 1) + " de " + p + " en la nube"};
                        if ($.metadata && $.metadata.hasPendingWrites) return {ok: false, motivo: "pendiente de subir (trozo " + (U + 1) + " de " + p + " en cola)"};
                    }
                    return {ok: true, trozos: p};
                },
                blobDe: async C => {
                    let N = window.bh10Adj.refId(C);
                    if (!N) return null;
                    let z = await Qa(cn(baseDatos, ...I, "adj", String(N)));
                    if (!z.exists()) return null;
                    let D = z.data() || {},
                        F = D.v || "";
                    if (+D.p > 0) {
                        F = "";
                        for (let U = 0; U < +D.p; U++) {
                            let $ = await Qa(cn(baseDatos, ...I, "adj", String(N) + "~" + U));
                            // v352: un trozo ausente antes se concatenaba como "" y salía un
                            // PDF truncado sin aviso. Ahora se dice.
                            if (!$.exists() || !($.data() || {}).v) throw new Error("Documento incompleto en la nube: falta el trozo " + (U + 1) + " de " + D.p);
                            F += $.data().v
                        }
                    }
                    if (!F) return null;
                    let R = atob(F),
                        M = new Uint8Array(R.length);
                    for (let U = 0; U < R.length; U++) M[U] = R.charCodeAt(U);
                    return {
                        blob: new Blob([M], {
                            type: D.mime || "application/octet-stream"
                        }),
                        nombre: D.nombre || "documento"
                    }
                },
                abrir: async C => {
                    let N = await window.bh10Adj.blobDe(C);
                    if (!N) return !1;
                    let z = URL.createObjectURL(N.blob);
                    return window.open(z, "_blank"), setTimeout(() => URL.revokeObjectURL(z), 6e4), !0
                }
            }, window.bh10Buzon = {
                enlace: () => location.origin + "/facturas",
                activarPortal: async C => (await Ni(cn(baseDatos, "portal", "default"), {
                    uid: t.uid,
                    empresas: (C || []).map(N => ({
                        sub: N.sub || "",
                        nombre: N.nombre || "Empresa"
                    })),
                    act: Date.now()
                }), (C || []).length),
                listar: async () => (await Gs(pa(baseDatos, ...I, "buzon"))).docs.map(C => ({
                    id: C.id,
                    ...C.data() || {}
                })).sort((C, N) => String(C.creado && C.creado.seconds || 0) < String(N.creado && N.creado.seconds || 0) ? 1 : -1),
                borrar: async C => {
                    await ql(cn(baseDatos, ...I, "buzon", C))
                }
            }, window.bh10Invitar = async C => {
                if (g === "lector") throw new Error("solo-consulta");
                let N = (() => { // v371 · Jesús: «que los enlaces sean cortos». 8 caracteres de un
                        // alfabeto sin parejas confundibles (ni 0/O ni 1/I/l): se dictan por
                        // teléfono sin equivocarse y caben en un WhatsApp. Como son de un solo
                        // uso, caducan y se BORRAN al usarse, 32^8 combinaciones sobran.
                        const A = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ", b = new Uint8Array(8);
                        crypto.getRandomValues(b);
                        return Array.from(b, x => A[x % A.length]).join("");
                    })(),
                    z = {};
                // v367 · vivienda (etiqueta que ve el comprador) y viviendaId / obraId (para enlazar lo que llegue con la vivienda)
                return ["nombre", "cif", "dir", "cp", "municipio", "provincia", "email", "telefono", "contacto", "motivo", "empresaNombre", "empresaNif", "empresaEmail", "vivienda", "viviendaId", "obraId", "docId", "titulo", "huella"].forEach(D => {
                    C && C[D] && (z[D] = String(C[D]).slice(0, 200))
                }),
                // v370 · enlace de FIRMA: además de los datos, viaja el texto íntegro del
                // contrato (no cabe en 200 caracteres) y la marca `firmar`. El comprador ve
                // exactamente ese texto y firma sobre él con el dedo.
                C && C.firmar && (z.firmar = !0, z.texto = String(C.texto || "").slice(0, 120000)),
                await Ni(cn(baseDatos, "invitaciones", N), {
                    ...z,
                    soloFiscal: !!(C && C.soloFiscal),
                    destino: [...I, "cliRecibidos", N],
                    usado: !1,
                    creado: Date.now(),
                    caduca: Date.now() + 30 * 864e5
                }), location.origin + "/c/?t=" + N
            }, window.bh10Dni = {
                listar: async () => (await Gs(pa(baseDatos, ...I, "cliDni"))).docs.map(C => {
                    let N = C.data() || {};
                    return {
                        id: C.id,
                        titular: N.titular,
                        cara: N.cara,
                        nombreTitular: N.nombreTitular || "",
                        recibido: N.recibido || 0,
                        borrarAntesDe: N.borrarAntesDe || 0,
                        envio: N.envio || "",
                        cliente: N.cliente || "",
                        bytes: String(N.img || "").length
                    }
                }).sort((C, N) => (C.borrarAntesDe || 0) - (N.borrarAntesDe || 0)),
                ver: async C => {
                    let N = await Qa(cn(baseDatos, ...I, "cliDni", C));
                    return N.exists() && (N.data() || {}).img || ""
                },
                marcarCliente: async (C, N) => {
                    let z = await Qa(cn(baseDatos, ...I, "cliDni", C));
                    z.exists() && await Ni(cn(baseDatos, ...I, "cliDni", C), {
                        ...z.data() || {},
                        cliente: String(N || "").slice(0, 120)
                    })
                },
                borrar: async C => {
                    await ql(cn(baseDatos, ...I, "cliDni", C))
                },
                borrarDeEnvio: async C => {
                    let N = (await Gs(pa(baseDatos, ...I, "cliDni"))).docs.filter(z => (z.data() || {}).envio === C);
                    for (let z of N) await ql(cn(baseDatos, ...I, "cliDni", z.id));
                    return N.length
                }
            }, window.bh10Rgpd = async () => {
                let C = {
                        clientes: [],
                        proveedores: [],
                        error: ""
                    },
                    N = async (D, F, R) => {
                        (await Gs(pa(baseDatos, ...I, D))).docs.forEach(U => {
                            let $ = U.data() || {};
                            $.rgpd && C[F].push({
                                id: U.id,
                                nombre: $[R] || $.nombre || "",
                                cif: $.cif || "",
                                ...$.rgpd,
                                pendiente: $.estado === "pendiente"
                            })
                        })
                    };
                try {
                    await N("cliRecibidos", "clientes", "nombre")
                } catch (D) {
                    C.error = String(D && D.code || D)
                }
                try {
                    await N("buzon", "proveedores", "nombre")
                } catch (D) {
                    C.error || (C.error = String(D && D.code || D))
                }
                let z = (D, F) => String(F.cuando || "").localeCompare(String(D.cuando || ""));
                return C.clientes.sort(z), C.proveedores.sort(z), C
            }, window.bh10Fichaje = {
                alta: async (C, N) => {
                    let z = String(C || "").replace(/\D/g, "");
                    if (z.length < 9) throw new Error("Teléfono no válido");
                    return await Ni(cn(baseDatos, "altasFichaje", z), {
                        empresaUid: t.uid, // (corregido: era «uid» sin declarar, un ReferenceError latente)
                        empleadoId: String(N && N.empleadoId || ""),
                        nombre: String(N && N.nombre || "").slice(0, 120),
                        empresa: String(N && N.empresa || ""),
                        creado: new Date().toISOString()
                    }), z
                },
                bajaAlta: async C => {
                    let N = String(C || "").replace(/\D/g, "");
                    await ql(cn(baseDatos, "altasFichaje", N))
                },
                trabajadores: async () => {
                    let C = PN(pa(baseDatos, "fichajes"), ZV("empresaUid", "==", uid));
                    return (await Gs(C)).docs.map(N => ({
                        uid: N.id,
                        ...N.data() || {}
                    }))
                },
                registros: async (C, N, z) => {
                    let D = PN(pa(baseDatos, "fichajes", C, "registros"), eU("fecha", "desc"));
                    return (await Gs(D)).docs.map(F => ({
                        id: F.id,
                        ...F.data() || {}
                    })).filter(F => (!N || F.fecha >= N) && (!z || F.fecha <= z))
                },
                publicarJornada: async (C, N) => {
                    let z = N && typeof N == "object" ? N : {},
                        D = {};
                    ["L", "M", "X", "J", "V", "S", "D"].forEach(F => {
                        D[F] = String(z[F] || "")
                    }), await Ni(cn(baseDatos, "fichajes", C, "config", "jornada"), {
                        ...D,
                        actualizado: new Date().toISOString()
                    })
                },
                rectificar: async (C, N) => {
                    await rU(pa(baseDatos, "fichajes", C, "rectificaciones"), {
                        ...N || {},
                        creado: lU(),
                        autor: autenticacion.currentUser && autenticacion.currentUser.email || ""
                    })
                },
                rectificaciones: async C => (await Gs(pa(baseDatos, "fichajes", C, "rectificaciones"))).docs.map(N => ({
                    id: N.id,
                    ...N.data() || {}
                }))
            }, window.bh10Derechos = {
                listar: async () => (await Gs(pa(baseDatos, ...I, "cliDerechos"))).docs.map(C => ({
                    id: C.id,
                    ...C.data() || {}
                })).sort((C, N) => String(C.recibida || "").localeCompare(String(N.recibida || ""))),
                resolver: async (C, N) => {
                    let z = await Qa(cn(baseDatos, ...I, "cliDerechos", C));
                    z.exists() && await Ni(cn(baseDatos, ...I, "cliDerechos", C), {
                        ...z.data() || {},
                        estado: "resuelta",
                        resueltaEn: new Date().toISOString(),
                        resolucion: String(N || "").slice(0, 1200)
                    })
                },
                borrar: async C => {
                    await ql(cn(baseDatos, ...I, "cliDerechos", C))
                }
            }, window.bh10Recibidos = {
                listar: async () => (await Gs(pa(baseDatos, ...I, "cliRecibidos"))).docs.map(C => ({
                    id: C.id,
                    ...C.data() || {}
                })).sort((C, N) => String(N.creado && N.creado.seconds || 0) < String(C.creado && C.creado.seconds || 0) ? -1 : 1),
                borrar: async C => {
                    await ql(cn(baseDatos, ...I, "cliRecibidos", C))
                }
            }, window.bh10Capas = async () => {
                let C = {
                    nube: "?",
                    nubeFecha: "",
                    local: "?",
                    localFecha: "",
                    ruta: I.join("/")
                };
                try {
                    let N = await Qa(cn(baseDatos, ...I, "kv", "bh10-fc-v3"));
                    if (!N.exists()) C.nube = "(no existe en la nube)";
                    else {
                        let z = N.data() || {},
                            D = z.v || "";
                        if (+z.p > 0) {
                            D = "";
                            for (let F = 0; F < +z.p; F++) {
                                let R = await Qa(cn(baseDatos, ...I, "kv", "bh10-fc-v3~" + F));
                                D += (R.data() || {}).v || ""
                            }
                        }
                        if (z.z) try {
                            D = await hne(D)
                        } catch {
                            C.nube = "ERROR al descomprimir"
                        }
                        if (C.nube === "?") try {
                            C.nube = JSON.parse(D || "[]").length
                        } catch {
                            C.nube = "ERROR al interpretar"
                        }
                        C.nubeFecha = z.u ? new Date(z.u).toLocaleString("es-ES") : "sin fecha"
                    }
                } catch (N) {
                    C.nube = "ERROR: " + String(N && N.code || N)
                }
                try {
                    let N = "bh10ls:" + t.uid + ":" + (c || "") + ":",
                        z = "bh10lsu:" + t.uid + ":" + (c || "") + ":",
                        D = localStorage.getItem(N + "bh10-fc-v3");
                    C.local = D ? JSON.parse(D).length : "(vacío)";
                    let F = localStorage.getItem(z + "bh10-fc-v3");
                    C.localFecha = F ? new Date(+F).toLocaleString("es-ES") : "sin fecha"
                } catch {
                    C.local = "ERROR"
                }
                return C
            }, window.bh10Test = async () => {
                let C = {
                        modo: g,
                        empresa: _.nombre || "",
                        ruta: I.join("/"),
                        escritura: "",
                        lectura: "",
                        error: ""
                    },
                    N = cn(baseDatos, ...I, "kv", "__diag"),
                    z = "t" + Date.now();
                try {
                    await Ni(N, {
                        v: z,
                        u: Date.now(),
                        dev: idSesion
                    }), C.escritura = "OK"
                } catch (D) {
                    return C.escritura = "FALLA", C.error = String(D && D.code || D), C
                }
                try {
                    let D = await Qa(N);
                    C.lectura = D.exists() && (D.data() || {}).v === z ? "OK" : "no coincide"
                } catch (D) {
                    C.lectura = "FALLA", C.error = String(D && D.code || D)
                }
                try {
                    await ql(N)
                } catch {}
                return C
            }, window.bh10Diag = () => {
                let C = "bh10ls:" + t.uid + ":" + (c || "") + ":",
                    N = 0;
                try {
                    for (let z = 0; z < localStorage.length; z++) {
                        let D = localStorage.key(z);
                        D && D.startsWith(C) && N++
                    }
                } catch {}
                return {
                    empresa: _.nombre || "",
                    sub: c || "(principal)",
                    modo: g,
                    claves: N,
                    correo: t.email || "",
                    ruta: I.join("/")
                }
            }, window.bh10Resync = () => {
                try {
                    let C = "bh10ls:" + t.uid + ":" + (c || "") + ":",
                        N = "bh10lsu:" + t.uid + ":" + (c || "") + ":",
                        z = [];
                    for (let D = 0; D < localStorage.length; D++) {
                        let F = localStorage.key(D);
                        F && (F.startsWith(C) || F.startsWith(N)) && z.push(F)
                    }
                    z.forEach(D => localStorage.removeItem(D))
                } catch {}
                try { window.bh10LimpiarCache && window.bh10LimpiarCache(); } catch {}
                location.reload()
            }, window.bh10LimpiarCache = (todo) => {
                // v365 · Jesús (05-09-2026): al cerrar sesión no puede quedar la copia local (facturas, IBAN,
                // nóminas) en el navegador: se vacía todo lo que la app guarda en este aparato
                try {
                    const borrar = [];
                    // se vacían los DATOS (caché de la nube y sus fechas) y los ajustes de la app;
                    // se conservan Face ID y su cofre, el id del aparato y el cierre automático: si no,
                    // cada cierre por inactividad obligaría a volver a meter la contraseña
                    const conservar = new Set([Jb, _5, "bh10-modo", "bh10-empresa", "bh10-autocierre"]);
                    for (let k = 0; k < localStorage.length; k++) { const c = localStorage.key(k); if (c && /^bh10/.test(c) && !conservar.has(c) ) borrar.push(c); }
                    borrar.forEach(c => localStorage.removeItem(c));
                    try { sessionStorage.clear(); } catch {}
                    return borrar.length;
                } catch { return 0; }
            }, window.bh10Logout = async () => {
                window.bh10LimpiarCache();
                await rA(autenticacion), location.reload()
            }, window.bh10Token = async () => {
                // v368 · token de Firebase del usuario en sesión: con él el Worker sabe quién llama (sin secreto compartido)
                try { const u = autenticacion.currentUser; return u ? await u.getIdToken() : ''; } catch { return ''; }
            }, window.bh10InvitacionUsada = async (token) => {
                // v368 · el enlace del portal es de UN solo uso.
                // v371 · Jesús: «una vez se usen, al ser temporales se borran y dejan de
                // existir». Ya no se marca: se BORRA la invitación. Lo que el cliente mandó
                // vive en cliRecibidos, así que no se pierde nada al quitar el enlace.
                try { await ql(cn(baseDatos, "invitaciones", String(token))); return !0; } catch (e) { console.warn("no se pudo borrar la invitación", e); return !1; }
            }, window.bh10OlvidarAparato = async () => {
                // como cerrar sesión, y además se retira el aparato de la lista de sesiones y se
                // borra TODO lo local, incluidos Face ID y su cofre (para un aparato que deja de ser tuyo)
                window.bh10LimpiarCache("todo");
                try { for (let k = localStorage.length - 1; k >= 0; k--) { const c = localStorage.key(k); if (c && /^bh10/.test(c)) localStorage.removeItem(c); } } catch {}
                try { if (window.bh10Sesiones && window.bh10Sesiones.cerrarEsta) await window.bh10Sesiones.cerrarEsta(); } catch {}
                try { await rA(autenticacion); } catch {}
                location.reload()
            }, window.bh10FaceID = {
                soportado: dne(),
                activo: () => {
                    try {
                        return !!(C5() && localStorage.getItem(Jb))
                    } catch {
                        return !1
                    }
                },
                activar: async C => {
                    if (!t || !t.email) throw new Error("sin-sesion");
                    return await VDe(t.email), zDe(t.email, C), w(!0), !0
                },
                desactivar: () => {
                    BDe();
                    try {
                        localStorage.removeItem(Jb)
                    } catch {}
                    return w(!1), !0
                }
            }, i(!1), k.start().then(() => i(!0))
        }, [t, c, g, s]), !n) return (0, dt.jsx)(Pantallita, {
        texto: "Iniciando…"
    });
    if (!t) {
        let _ = C5();
        return (0, dt.jsx)(PantallaLogin, {
            faceDisponible: dne() && !!_ && S,
            onFace: async () => {
                await UDe();
                let I = C5();
                if (!I) throw new Error("sin-vault");
                await nA(autenticacion, I.e, I.p)
            },
            onEntrar: async (I, k) => {
                await nA(autenticacion, I, k)
            }
        })
    }
    return s === null ? (0, dt.jsx)(Pantallita, {
        texto: "Cargando empresas…"
    }) : c === null ? (0, dt.jsx)($De, {
        lista: s,
        correo: t.email,
        onElegir: _ => {
            try {
                localStorage.setItem("bh10-empresa", _)
            } catch {}
            f(_)
        },
        onSalir: async () => {
            await rA(autenticacion), location.reload()
        }
    }) : g ? o ? (0, dt.jsx)(CargadorApp, {}) : (0, dt.jsx)(Pantallita, {
        texto: "Sincronizando datos…"
    }) : (0, dt.jsx)(WDe, {
        empresa: (s.find(_ => (_.sub || "") === c) || {}).nombre || "Empresa",
        onElegir: _ => {
            try {
                localStorage.setItem("bh10-modo", _)
            } catch {}
            h(_)
        },
        onVolver: () => {
            try {
                localStorage.removeItem("bh10-empresa")
            } catch {}
            f(null)
        }
    })
}
var UHe = {
    crearStorage: crearAlmacen
};
(typeof window < "u" && (window.__BH10_RDOM = fne)), (0, fne.createRoot)(document.getElementById("root")).render((0, dt.jsx)(Raiz, {}));
export {
    UHe as __shell
};
/*! Bundled license information:

react/cjs/react.production.min.js:
  (**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.min.js:
  (**
   * @license React
   * scheduler.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.min.js:
  (**
   * @license React
   * react-dom.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-is/cjs/react-is.production.min.js:
  (**
   * @license React
   * react-is.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

decimal.js-light/decimal.js:
  (*! decimal.js-light v2.5.1 https://github.com/MikeMcl/decimal.js-light/LICENCE *)

react/cjs/react-jsx-runtime.production.min.js:
  (**
   * @license React
   * react-jsx-runtime.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

@firebase/util/dist/index.esm2017.js:
@firebase/util/dist/index.esm2017.js:
@firebase/util/dist/index.esm2017.js:
@firebase/util/dist/index.esm2017.js:
@firebase/util/dist/index.esm2017.js:
@firebase/util/dist/index.esm2017.js:
@firebase/util/dist/index.esm2017.js:
@firebase/util/dist/index.esm2017.js:
@firebase/util/dist/index.esm2017.js:
@firebase/util/dist/index.esm2017.js:
@firebase/logger/dist/esm/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
@firebase/util/dist/index.esm2017.js:
@firebase/util/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
@firebase/component/dist/esm/index.esm2017.js:
@firebase/app/dist/esm/index.esm2017.js:
@firebase/app/dist/esm/index.esm2017.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
firebase/app/dist/esm/index.esm.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm2017.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm2017.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm2017/index-68602d24.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/webchannel-wrapper/dist/bloom-blob/esm/bloom_blob_es2018.js:
@firebase/webchannel-wrapper/dist/webchannel-blob/esm/webchannel_blob_es2018.js:
  (** @license
  Copyright The Closure Library Authors.
  SPDX-License-Identifier: Apache-2.0
  *)
  (** @license
  
   Copyright The Closure Library Authors.
   SPDX-License-Identifier: Apache-2.0
  *)

@firebase/firestore/dist/index.esm2017.js:
  (**
  * @license
  * Copyright 2020 Google LLC
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *   http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/index.esm2017.js:
@firebase/firestore/dist/index.esm2017.js:
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/