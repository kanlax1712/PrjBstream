package com.bstream.app;

import android.Manifest;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Requests CAMERA and RECORD_AUDIO at the native Android level so that
 * navigator.mediaDevices.getUserMedia() works in the WebView (Go Live).
 */
@CapacitorPlugin(
    name = "BstreamMediaPermissions",
    permissions = {
        @Permission(strings = { Manifest.permission.CAMERA }, alias = "camera"),
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone")
    }
)
public class BstreamMediaPermissionsPlugin extends Plugin {

    @PluginMethod
    public void requestMediaPermissions(PluginCall call) {
        requestPermissionForAliases(new String[] { "camera", "microphone" }, call, "onMediaPermissionsResult");
    }

    @PermissionCallback
    private void onMediaPermissionsResult(PluginCall call) {
        if (call == null) return;
        boolean cameraGranted = getPermissionState("camera") == PermissionState.GRANTED;
        boolean micGranted = getPermissionState("microphone") == PermissionState.GRANTED;
        boolean granted = cameraGranted && micGranted;
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        ret.put("camera", cameraGranted);
        ret.put("microphone", micGranted);
        call.resolve(ret);
    }
}
