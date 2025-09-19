/* ************************************************************************** */
/*                                                                            */
/*                                                      :::    :::    :::     */
/*   Problem Number: 32642                             :+:    :+:      :+:    */
/*                                                    +:+    +:+        +:+   */
/*   By: jack0969 <boj.kr/u/jack0969>                +#+    +#+          +#+  */
/*                                                  +#+      +#+        +#+   */
/*   https://boj.kr/32642                          #+#        #+#      #+#    */
/*   Solved: 2025/09/10 00:13:10 by jack0969      ###          ###   ##.kr    */
/*                                                                            */
/* ************************************************************************** */
#include <iostream>
using namespace std;

int main(){
    ios::sync_with_stdio(0);
    long long anger = 0;
    int n, x;
    long long result=0;

    cin >> n;

    for(int i = 0; i < n; i++){
        cin >> x;  
        if(x == 1){
            anger+=1;
        }
        else{
            anger-=1;
        }
        result+=anger;
    }

    cout << result;
    return 0;
}