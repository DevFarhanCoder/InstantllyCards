package com.instantllycards.www.twa

import android.os.RemoteException
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class InstallReferrerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "InstallReferrer"
    }

    @ReactMethod
    fun getInstallReferrer(promise: Promise) {
        val referrerClient = InstallReferrerClient.newBuilder(reactApplicationContext).build()
        
        referrerClient.startConnection(object : InstallReferrerStateListener {
            override fun onInstallReferrerSetupFinished(responseCode: Int) {
                when (responseCode) {
                    InstallReferrerClient.InstallReferrerResponse.OK -> {
                        try {
                            val response = referrerClient.installReferrer
                            val referrerUrl = response.installReferrer
                            promise.resolve(referrerUrl)
                            referrerClient.endConnection()
                        } catch (e: RemoteException) {
                            promise.reject("ERROR", "Failed to get referrer: ${e.message}")
                            referrerClient.endConnection()
                        }
                    }
                    InstallReferrerClient.InstallReferrerResponse.FEATURE_NOT_SUPPORTED -> {
                        promise.reject("NOT_SUPPORTED", "Install Referrer not supported")
                        referrerClient.endConnection()
                    }
                    InstallReferrerClient.InstallReferrerResponse.SERVICE_UNAVAILABLE -> {
                        promise.reject("UNAVAILABLE", "Install Referrer service unavailable")
                        referrerClient.endConnection()
                    }
                    else -> {
                        promise.reject("UNKNOWN", "Unknown response code: $responseCode")
                        referrerClient.endConnection()
                    }
                }
            }

            override fun onInstallReferrerServiceDisconnected() {
                promise.reject("DISCONNECTED", "Install Referrer service disconnected")
            }
        })
    }
}
